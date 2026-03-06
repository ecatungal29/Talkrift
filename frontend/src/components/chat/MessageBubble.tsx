import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Message } from "@/store/chatStore";
import { parseEmoticons } from "@/lib/emojiParser";

interface Props {
	message: Message;
	isOwn: boolean;
	showSender?: boolean;
	isSeen?: boolean;
	isFirstInGroup?: boolean;
	isLastInGroup?: boolean;
}

export function MessageBubble({
	message,
	isOwn,
	showSender = false,
	isSeen = false,
	isFirstInGroup = true,
	isLastInGroup = true,
}: Props) {
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

	// Corner radius: tighten the "inner" corners for consecutive messages
	const bubbleRadius = isOwn
		? [
				"rounded-2xl",
				!isFirstInGroup && "rounded-tr-sm",
				!isLastInGroup && "rounded-br-sm",
			]
			.filter(Boolean)
			.join(" ")
		: [
				"rounded-2xl",
				!isFirstInGroup && "rounded-tl-sm",
				!isLastInGroup && "rounded-bl-sm",
			]
			.filter(Boolean)
			.join(" ");

	return (
		<div className={`flex gap-2 items-end ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
			{/* Avatar column — always reserve space to keep bubbles aligned */}
			{!isOwn && (
				isLastInGroup ? (
					<Avatar className="h-7 w-7 flex-shrink-0">
						<AvatarImage src={message.sender.avatar ?? undefined} />
						<AvatarFallback className="text-[10px] bg-primary/20 text-primary">
							{initials}
						</AvatarFallback>
					</Avatar>
				) : (
					<div className="w-7 flex-shrink-0" />
				)
			)}

			<div className={`flex flex-col gap-0.5 max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}>
				{showSender && !isOwn && (
					<span className="text-xs text-muted-foreground px-1">
						{message.sender.display_name}
					</span>
				)}

				<div
					className={`${bubbleRadius} px-3 py-2 text-sm break-words ${
						isOwn
							? "bg-primary text-zinc-900"
							: "bg-[#363636] text-foreground"
					}`}
				>
					{parsedContent}
				</div>

				{/* Timestamp + seen — only on last message of a group */}
				{isLastInGroup && (
					<div className="flex items-center gap-1 px-1">
						<span className="text-[10px] text-muted-foreground">{time}</span>
						{isOwn && isSeen && (
							<span className="text-[10px] text-primary font-medium">· Seen</span>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
