"use client";

import { useState } from "react";
import { FileText, Download } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Message } from "@/store/chatStore";
import { parseEmoticons } from "@/lib/emojiParser";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "😡"];

interface Props {
	message: Message;
	isOwn: boolean;
	currentUserId: number;
	showSender?: boolean;
	isSeen?: boolean;
	isFirstInGroup?: boolean;
	isLastInGroup?: boolean;
	onReact: (messageId: number, emoji: string) => void;
}

export function MessageBubble({
	message,
	isOwn,
	currentUserId,
	showSender = false,
	isSeen = false,
	isFirstInGroup = true,
	isLastInGroup = true,
	onReact,
}: Props) {
	const [hovered, setHovered] = useState(false);
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

	const reactionEntries = Object.entries(message.reactions ?? {});

	return (
		<div
			className={`flex gap-2 items-end ${isOwn ? "flex-row-reverse" : "flex-row"}`}
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
		>
			{/* Avatar column */}
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

				{/* Bubble + quick reaction picker side-by-side */}
				<div className={`flex items-center gap-1.5 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
					<div
						className={`${bubbleRadius} text-sm break-words overflow-hidden ${
							isOwn ? "bg-primary text-zinc-900" : "bg-[#363636] text-foreground"
						}`}
					>
						{message.message_type === "image" && message.file ? (
							<div>
								<img
									src={message.file}
									alt="image"
									className="max-w-[240px] max-h-[320px] object-cover"
								/>
								{message.content && (
									<p className="px-3 py-1.5">{parsedContent}</p>
								)}
							</div>
						) : message.message_type === "file" && message.file ? (
							<a
								href={message.file}
								target="_blank"
								rel="noopener noreferrer"
								download
								className="flex items-center gap-2 px-3 py-2 hover:opacity-80 transition-opacity"
							>
								<FileText className="h-8 w-8 flex-shrink-0 opacity-80" />
								<div className="min-w-0">
									<p className="text-xs font-medium truncate max-w-[160px]">
										{message.file.split("/").pop()}
									</p>
									{message.content && (
										<p className="text-xs opacity-70 truncate">{message.content}</p>
									)}
								</div>
								<Download className="h-4 w-4 flex-shrink-0 opacity-60" />
							</a>
						) : (
							<div className="px-3 py-2">{parsedContent}</div>
						)}
					</div>

					{/* Quick reaction picker — appears on hover */}
					{hovered && message.id > 0 && (
						<div className="flex items-center gap-0.5 bg-card border border-border rounded-full px-1.5 py-1 shadow-md">
							{QUICK_REACTIONS.map((emoji) => (
								<button
									key={emoji}
									onClick={() => onReact(message.id, emoji)}
									className="text-sm leading-none hover:scale-125 transition-transform px-0.5"
								>
									{emoji}
								</button>
							))}
						</div>
					)}
				</div>

				{/* Existing reactions */}
				{reactionEntries.length > 0 && (
					<div className="flex flex-wrap gap-1 px-1 mt-0.5">
						{reactionEntries.map(([emoji, userIds]) => {
							const iReacted = userIds.includes(currentUserId);
							return (
								<button
									key={emoji}
									onClick={() => onReact(message.id, emoji)}
									className={`flex items-center gap-0.5 text-xs rounded-full px-2 py-0.5 border transition-colors ${
										iReacted
											? "bg-primary/20 border-primary/50 text-foreground"
											: "bg-accent border-border text-muted-foreground hover:border-primary/40"
									}`}
								>
									<span>{emoji}</span>
									<span>{userIds.length}</span>
								</button>
							);
						})}
					</div>
				)}

				{/* Timestamp + seen */}
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
