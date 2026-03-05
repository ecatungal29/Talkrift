import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Message } from "@/store/chatStore";
import { parseEmoticons } from "@/lib/emojiParser";

interface Props {
	message: Message;
	isOwn: boolean;
	showSender?: boolean;
	isSeen?: boolean;
}

export function MessageBubble({ message, isOwn, showSender = false, isSeen = false }: Props) {
	const initials = message.sender.display_name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);

	const time = new Date(message.created_at).toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit",
	});

	const parsedContent = parseEmoticons(message.content);

	return (
		<div className={`flex gap-2 items-end ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
			{!isOwn && (
				<Avatar className="h-7 w-7 flex-shrink-0">
					<AvatarImage src={message.sender.avatar ?? undefined} />
					<AvatarFallback className="text-[10px] bg-primary/20 text-primary">
						{initials}
					</AvatarFallback>
				</Avatar>
			)}
			<div className={`flex flex-col gap-0.5 max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}>
				{showSender && !isOwn && (
					<span className="text-xs text-muted-foreground px-1">
						{message.sender.display_name}
					</span>
				)}
				<div
					className={`rounded-2xl px-3 py-2 text-sm break-words ${
						isOwn
							? "bg-primary text-primary-foreground rounded-br-sm"
							: "bg-accent text-foreground rounded-bl-sm"
					}`}>
					{parsedContent}
				</div>
				<div className="flex items-center gap-1 px-1">
					<span className="text-[10px] text-muted-foreground">{time}</span>
					{isOwn && isSeen && (
						<span className="text-[10px] text-primary font-medium">· Seen</span>
					)}
				</div>
			</div>
		</div>
	);
}
