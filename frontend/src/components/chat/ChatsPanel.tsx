"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useChatStore } from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";
import { getRooms } from "@/api/chat";
import { CreateGroupModal } from "./CreateGroupModal";
import type { Room } from "@/store/chatStore";

interface Props {
	searchQuery: string;
}

export function ChatsPanel({ searchQuery }: Props) {
	const router = useRouter();
	const rooms = useChatStore((s) => s.rooms);
	const activeRoomId = useChatStore((s) => s.activeRoomId);
	const setRooms = useChatStore((s) => s.setRooms);
	const user = useAuthStore((s) => s.user);
	const [showCreateGroup, setShowCreateGroup] = useState(false);

	const handleGroupCreated = (room: Room) => {
		setRooms([room, ...rooms]);
		router.push(`/chat/${room.id}`);
	};

	useEffect(() => {
		getRooms()
			.then(setRooms)
			.catch(() => {});
	}, [setRooms]);

	const filtered = rooms.filter((room) => {
		if (!searchQuery.trim()) return true;
		const q = searchQuery.toLowerCase();
		if (room.room_type === "dm") {
			const other = room.participants.find((p) => p.id !== user?.id);
			return other?.display_name.toLowerCase().includes(q);
		}
		return room.name.toLowerCase().includes(q);
	});

	const newGroupButton = (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="h-6 w-6 text-muted-foreground hover:text-primary flex-shrink-0"
					onClick={() => setShowCreateGroup(true)}
				>
					<Plus className="h-3.5 w-3.5" />
				</Button>
			</TooltipTrigger>
			<TooltipContent>New group</TooltipContent>
		</Tooltip>
	);

	if (filtered.length === 0) {
		return (
			<>
				<div className="flex items-center justify-between px-3 pt-1 pb-0.5">
					<span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">
						Groups
					</span>
					{newGroupButton}
				</div>
				<div className="flex flex-col items-center justify-center flex-1 gap-2 py-12 px-4 text-center">
					<MessageSquare className="h-8 w-8 text-muted-foreground" />
					<p className="text-sm font-medium">
						{rooms.length === 0 ? "No chats yet" : "No results"}
					</p>
					<p className="text-xs text-muted-foreground">
						{rooms.length === 0 ?
							"Add contacts to start messaging"
						:	"Try a different search"}
					</p>
				</div>
				<CreateGroupModal
					isOpen={showCreateGroup}
					onClose={() => setShowCreateGroup(false)}
					onCreated={handleGroupCreated}
				/>
			</>
		);
	}

	return (
		<>
		<div className="flex items-center justify-between px-3 pt-1 pb-0.5">
			<span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">
				Groups
			</span>
			{newGroupButton}
		</div>
		<div className="flex-1 overflow-y-auto">
			{filtered.map((room) => {
				const other =
					room.room_type === "dm" ?
						(room.participants.find((p) => p.id !== user?.id) ??
						room.participants[0])
					:	null;

				const displayName =
					room.room_type === "dm" ?
						(other?.display_name ?? "Unknown")
					:	room.name || `Group (${room.participants.length})`;

				const initials = displayName
					.split(" ")
					.map((n) => n[0])
					.join("")
					.toUpperCase()
					.slice(0, 2);

				const lastMsg = room.last_message;
				const time =
					lastMsg ?
						new Date(lastMsg.created_at).toLocaleTimeString([], {
							hour: "2-digit",
							minute: "2-digit",
						})
					:	"";

				// Unread: last message from someone else and current user not in read_by_ids
				const isUnread =
					!!lastMsg &&
					lastMsg.sender.id !== user?.id &&
					!(lastMsg.read_by_ids ?? []).includes(user?.id ?? -1);

				return (
					<button
						key={`${room.id}-${lastMsg?.created_at || ""}`}
						onClick={() => router.push(`/chat/${room.id}`)}
						className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-accent/50 transition-colors ${
							activeRoomId === room.id ? "bg-accent" : ""
						}`}>
						<Avatar className="h-9 w-9 flex-shrink-0">
							<AvatarImage src={other?.avatar ?? undefined} />
							<AvatarFallback className="bg-primary/20 text-primary text-xs">
								{initials}
							</AvatarFallback>
						</Avatar>
						<div className="flex-1 min-w-0">
							<div className="flex items-center justify-between gap-1">
								<p className={`text-sm truncate ${isUnread ? "font-semibold text-foreground" : "font-medium"}`}>
									{displayName}
								</p>
								<div className="flex items-center gap-1.5 flex-shrink-0">
									{time && (
										<span className={`text-[10px] ${isUnread ? "text-primary font-medium" : "text-muted-foreground"}`}>
											{time}
										</span>
									)}
									{isUnread && (
										<span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
									)}
								</div>
							</div>
							{lastMsg && (
								<p className={`text-xs truncate ${isUnread ? "text-foreground" : "text-muted-foreground"}`}>
									{lastMsg.sender.id === user?.id ? "You: " : ""}
									{lastMsg.content}
								</p>
							)}
						</div>
					</button>
				);
			})}
		</div>
		<CreateGroupModal
			isOpen={showCreateGroup}
			onClose={() => setShowCreateGroup(false)}
			onCreated={handleGroupCreated}
		/>
		</>
	);
}
