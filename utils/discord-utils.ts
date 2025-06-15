import { Client, Guild, GuildMember, User } from 'discord.js';

export class DiscordUtils {
  static isValidSnowflake(id: string): boolean {
    return /^\d{17,19}$/.test(id);
  }

  static isValidUsername(username: string): boolean {
    return /^[a-zA-Z0-9_.]{2,32}$/.test(username);
  }

  static isValidDiscriminator(discriminator: string): boolean {
    return /^\d{4}$/.test(discriminator);
  }

  static parseDiscordHandle(handle: string): {
    type: 'user_id' | 'username' | 'username_with_discriminator';
    username?: string;
    discriminator?: string;
    userId?: string;
  } {
    const trimmedHandle = handle.trim();

    // Check if it's a user ID
    if (this.isValidSnowflake(trimmedHandle)) {
      return {
        type: 'user_id',
        userId: trimmedHandle
      };
    }

    // Check if it contains a discriminator
    if (trimmedHandle.includes('#')) {
      const parts = trimmedHandle.split('#');
      const username = parts[0];
      const discriminator = parts[1];
      
      if (username && discriminator && this.isValidUsername(username) && this.isValidDiscriminator(discriminator)) {
        return {
          type: 'username_with_discriminator',
          username,
          discriminator
        };
      }
    }

    // Check if it's just a username
    if (this.isValidUsername(trimmedHandle)) {
      return {
        type: 'username',
        username: trimmedHandle
      };
    }

    throw new Error('Invalid Discord handle format');
  }

  static async fetchAllGuildMembers(guild: Guild): Promise<void> {
    try {
      await guild.members.fetch();
      console.log(`Fetched ${guild.memberCount} members from guild: ${guild.name}`);
    } catch (error) {
      console.error('Error fetching guild members:', error);
      throw error;
    }
  }

  static async findMemberByHandle(guild: Guild, handle: string): Promise<GuildMember | null> {
    try {
      const parsed = this.parseDiscordHandle(handle);

      switch (parsed.type) {
        case 'user_id':
          try {
            return await guild.members.fetch(parsed.userId!);
          } catch {
            return null;
          }

        case 'username_with_discriminator':
          await this.fetchAllGuildMembers(guild);
          return guild.members.cache.find(member => 
            parsed.username && 
            member.user.username.toLowerCase() === parsed.username.toLowerCase() &&
            member.user.discriminator === parsed.discriminator
          ) || null;

        case 'username':
          await this.fetchAllGuildMembers(guild);
          return guild.members.cache.find(member => 
            parsed.username && (
              member.user.username.toLowerCase() === parsed.username.toLowerCase() ||
              member.displayName.toLowerCase() === parsed.username.toLowerCase()
            )
          ) || null;

        default:
          return null;
      }
    } catch (error) {
      console.error('Error finding member by handle:', error);
      return null;
    }
  }

  static formatUserInfo(member: GuildMember): {
    id: string;
    username: string;
    displayName: string;
    discriminator: string;
    tag: string;
  } {
    return {
      id: member.id,
      username: member.user.username,
      displayName: member.displayName,
      discriminator: member.user.discriminator,
      tag: member.user.tag
    };
  }

  static async checkBotPermissions(guild: Guild, requiredPermissions: string[]): Promise<{
    hasPermissions: boolean;
    missingPermissions: string[];
  }> {
    const botMember = guild.members.me;
    
    if (!botMember) {
      return {
        hasPermissions: false,
        missingPermissions: requiredPermissions
      };
    }

    const missingPermissions: string[] = [];

    for (const permission of requiredPermissions) {
      if (!botMember.permissions.has(permission as any)) {
        missingPermissions.push(permission);
      }
    }

    return {
      hasPermissions: missingPermissions.length === 0,
      missingPermissions
    };
  }

  static generateSecureApiKey(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }

  static logRoleAssignment(member: GuildMember, roleName: string, success: boolean, error?: string): void {
    const timestamp = new Date().toISOString();
    const userInfo = this.formatUserInfo(member);
    
    if (success) {
      console.log(`✅ [${timestamp}] Role "${roleName}" assigned to ${userInfo.tag} (${userInfo.id})`);
    } else {
      console.error(`❌ [${timestamp}] Failed to assign role "${roleName}" to ${userInfo.tag} (${userInfo.id}): ${error}`);
    }
  }
}
