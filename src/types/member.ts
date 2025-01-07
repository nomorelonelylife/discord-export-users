// src/types/member.ts
export interface MemberData {
    id: string;
    username: string;
    joinDate: string;
    roles: string;
}

export const validateMemberData = (data: MemberData): boolean => {
    return !!(
        data.id && 
        data.username && 
        typeof data.joinDate === 'string' && 
        typeof data.roles === 'string'
    );
};
