import { Client, Guild, GuildMember, Role } from 'discord.js';
import { discord } from '../config/bot-config.js';

export interface RoleAssignmentResult {
  success: boolean;
  message: string;
  data?: {
    userId: string;
    username: string;
    roleName: string;
  };
  error?: string;
}

export class RoleHandler {
  private client: Client;
  private guild: Guild | null = null;
  private targetRole: Role | null = null;

  constructor(client: Client) {
    this.client = client;
  }

  async initialize(): Promise<void> {
    try {
      this.guild = await this.client.guilds.fetch(discord.guildId!);
      this.targetRole = await this.guild.roles.fetch(discord.roleId!);
      
      if (!this.targetRole) {
        throw new Error(`Role with ID ${discord.roleId} not found`);
      }
      
      console.log(`✅ Role handler initialized. Target role: ${this.targetRole.name}`);
    } catch (error) {
      console.error('❌ Failed to initialize role handler:', error);
      throw error;
    }
  }

  async assignRole(discordHandle: string): Promise<RoleAssignmentResult> {
    try {
      // Validate inputs
      if (!this.guild || !this.targetRole) {
        return {
          success: false,
          message: 'Role handler not properly initialized',
          error: 'HANDLER_NOT_INITIALIZED'
        };
      }

      // Find the user
      const member = await this.findMember(discordHandle);
      if (!member) {
        return {
          success: false,
          message: 'User not found in the server',
          error: 'USER_NOT_FOUND'
        };
      }

      // Check if user already has the role
      if (member.roles.cache.has(this.targetRole.id)) {
        return {
          success: false,
          message: 'User already has this role',
          error: 'ROLE_ALREADY_ASSIGNED',
          data: {
            userId: member.id,
            username: member.user.username,
            roleName: this.targetRole.name
          }
        };
      }

      // Check bot permissions
      if (!this.guild.members.me?.permissions.has('ManageRoles')) {
        return {
          success: false,
          message: 'Bot lacks permission to manage roles',
          error: 'INSUFFICIENT_PERMISSIONS'
        };
      }

      // Check role hierarchy
      if (this.targetRole.position >= this.guild.members.me!.roles.highest.position) {
        return {
          success: false,
          message: 'Cannot assign role due to role hierarchy',
          error: 'ROLE_HIERARCHY_ERROR'
        };
      }

      // Assign the role
      await member.roles.add(this.targetRole);

      return {
        success: true,
        message: 'Role assigned successfully',
        data: {
          userId: member.id,
          username: member.user.username,
          roleName: this.targetRole.name
        }
      };

    } catch (error) {
      console.error('Error assigning role:', error);
      return {
        success: false,
        message: 'An error occurred while assigning the role',
        error: 'INTERNAL_ERROR'
      };
    }
  }

  private async findMember(discordHandle: string): Promise<GuildMember | null> {
    if (!this.guild) return null;

    try {
      // First, try to find by user ID (if it's a snowflake)
      if (/^\d{17,19}$/.test(discordHandle)) {
        try {
          return await this.guild.members.fetch(discordHandle);
        } catch (error) {
          // User ID not found, continue to username search
        }
      }

      // Search by username (with or without discriminator)
      await this.guild.members.fetch(); // Fetch all members
      
      // Try exact username match first
      let member = this.guild.members.cache.find(m => 
        m.user.username.toLowerCase() === discordHandle.toLowerCase()
      );

      if (member) return member;

      // Try username with discriminator format (username#1234)
      if (discordHandle.includes('#')) {
        const [username, discriminator] = discordHandle.split('#');
        if (username && discriminator) {
          member = this.guild.members.cache.find(m => 
            m.user.username.toLowerCase() === username.toLowerCase() && 
            m.user.discriminator === discriminator
          );
        }
      }

      // Try display name search
      if (!member) {
        member = this.guild.members.cache.find(m => 
          m.displayName.toLowerCase() === discordHandle.toLowerCase()
        );
      }

      return member || null;

    } catch (error) {
      console.error('Error finding member:', error);
      return null;
    }
  }

  isValidDiscordHandle(handle: string): boolean {
    // Check if it's a user ID (snowflake)
    if (/^\d{17,19}$/.test(handle)) {
      return true;
    }

    // Check if it's a valid username format
    if (/^[a-zA-Z0-9_.]{2,32}$/.test(handle)) {
      return true;
    }

    // Check if it's username#discriminator format
    if (/^[a-zA-Z0-9_.]{2,32}#\d{4}$/.test(handle)) {
      return true;
    }

    return false;
  }
}
