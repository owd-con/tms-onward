import { IconDot, IconWarning } from "@/assets/icons";
import { Badge } from "@/components";

type Props = {
  status: string;
  title?: string;
  activity?: string;
  actor?: string;
  time?: string;
  type: string;
};

const Activity = (props: Props) => {
  const colorMap: Record<string, string> = {
    process: "#FBBF24",
    completed: "#16A34A",
    new: "#DBDBDB"
  };

  const color = colorMap[props.status ?? ""] ?? "#9CA3AF"; // fallback ke gray

  const aliasTitle = () => {
    return props.type + ' Task ' + props.status
  }

  return (
    <div className="flex mb-2">
      <div className="w-6">
        <IconDot color={color} className="w-5 h-5 mt-1" />
      </div>
      <div className="text-base leading-7">
        <div className="flex place-items-center gap-2 font-semibold text-base-content capitalize">
          {aliasTitle()}{" "}
          {props.status === "active" && (
            <Badge size="sm" variant="warning">
              In Progress
            </Badge>
          )}{" "}
          {props.status === "error" && (
            <IconWarning className="h-4 w-4 text-red-500" />
          )}
        </div>
        <div className="font-normal text-base-content/60">{props.activity}</div>
        <div className="font-normal text-base">
          {props.actor} • {props.time}
        </div>
      </div>
    </div>
  );
};

export default Activity;
