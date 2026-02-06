import { Card as BaseCard } from "./card";
import { CardMedia } from "./media";
import { CardBody } from "./body";
import { CardHeader } from "./header";
import { CardActions } from "./actions";

export const Card = Object.assign(BaseCard, {
  Media: CardMedia,
  Body: CardBody,
  Header: CardHeader,
  Actions: CardActions,
});
