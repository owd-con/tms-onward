// Avatar/index.tsx
import { Avatar as BaseAvatar } from "./avatar";
import { AvatarGroup } from "./group";

export const Avatar = Object.assign(BaseAvatar, {
  Group: AvatarGroup,
});
