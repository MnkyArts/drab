import { RoleHandler } from '../handlers/role-handler.js';
import { discord } from '../config/bot-config.js';
import type { OAuthUser } from '../middleware/oauth-middleware.js';

export interface RoleAssignmentStatus {
  success: boolean;
  error?: string;
  user?: {
    discord_id: string;
    username: string;
  };
}

export class RoleService {
  private roleHandler: RoleHandler;

  constructor(roleHandler: RoleHandler) {
    this.roleHandler = roleHandler;
  }

  async assignRoleToOAuthUser(user: OAuthUser): Promise<RoleAssignmentStatus> {
    try {
      // Check if user is in the target guild
      if (!this.isUserInTargetGuild(user)) {
        return {
          success: false,
          error: 'not_in_server'
        };
      }

      // Use the user ID to assign the role
      const result = await this.roleHandler.assignRole(user.id);

      if (result.success) {
        return {
          success: true,
          user: {
            discord_id: user.id,
            username: `${user.username}#${user.discriminator}`
          }
        };
      }

      // Map role handler errors to OAuth errors
      let oauthError: string;
      switch (result.error) {
        case 'USER_NOT_FOUND':
          oauthError = 'not_in_server';
          break;
        case 'ROLE_ALREADY_ASSIGNED':
          oauthError = 'already_has_role';
          break;
        case 'INSUFFICIENT_PERMISSIONS':
        case 'ROLE_HIERARCHY_ERROR':
          oauthError = 'role_assignment_failed';
          break;
        default:
          oauthError = 'role_assignment_failed';
      }

      return {
        success: false,
        error: oauthError
      };

    } catch (error) {
      console.error('Error in role assignment service:', error);
      return {
        success: false,
        error: 'role_assignment_failed'
      };
    }
  }

  private isUserInTargetGuild(user: OAuthUser): boolean {
    if (!user.guilds || !discord.guildId) {
      return false;
    }

    return user.guilds.some(guild => guild.id === discord.guildId);
  }
}
