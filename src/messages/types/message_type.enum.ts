import { registerEnumType } from '@nestjs/graphql';

export enum MessageType {
  TEXT = 'text',
  EMOJI = 'emoji',
}

registerEnumType(MessageType, {
  name: 'MessageType',
});
