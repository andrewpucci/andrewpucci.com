export interface SocialLink {
  name: string;
  user: string;
  url: string;
}

export interface Author {
  name: string;
  occupation: string;
  location: string;
  avatar: string;
  pronouns: string;
  website: string;
  skills: string[];
  tools: string[];
  social: SocialLink[];
}
