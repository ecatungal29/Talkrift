"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Users, Settings, Menu, X, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { ContactsPanel } from "@/components/contacts/ContactsPanel";
import { ChatsPanel } from "@/components/chat/ChatsPanel";

type View = "chats" | "contacts";

export default function Sidebar() {
	const { user, logout } = useAuth();
	const [view, setView] = useState<View>("chats");
	const [search, setSearch] = useState("");
	const [mobileOpen, setMobileOpen] = useState(false);

	const initials =
		user?.display_name ?
			user.display_name
				.split(" ")
				.map((n) => n[0])
				.join("")
				.toUpperCase()
				.slice(0, 2)
		:	"?";

	const sidebarContent = (
		<div className="flex flex-col h-full">
			{/* Header */}
			<div className="flex items-center justify-between px-4 py-3 border-b border-border">
				<div className="flex items-center gap-2">
					<span className="text-lg font-bold">
						<span className="text-primary">T</span>alk<span className="text-primary">R</span>ift
					</span>
				</div>
				<Button
					variant="ghost"
					size="icon"
					className="md:hidden"
					onClick={() => setMobileOpen(false)}>
					<X className="h-4 w-4" />
				</Button>
			</div>

			{/* Nav tabs */}
			<div className="flex border-b border-border">
				<button
					onClick={() => {
						setView("chats");
						setSearch("");
					}}
					className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors ${
						view === "chats" ?
							"text-primary border-b-2 border-primary"
						:	"text-muted-foreground hover:text-foreground"
					}`}>
					<MessageSquare className="h-4 w-4" />
					Chats
				</button>
				<button
					onClick={() => {
						setView("contacts");
						setSearch("");
					}}
					className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors ${
						view === "contacts" ?
							"text-primary border-b-2 border-primary"
						:	"text-muted-foreground hover:text-foreground"
					}`}>
					<Users className="h-4 w-4" />
					Contacts
				</button>
			</div>

			{/* Search */}
			<div className="px-3 py-2.5">
				<Input
					placeholder={view === "chats" ? "Search chats…" : "Search contacts…"}
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="h-8 text-sm bg-accent border-0"
				/>
			</div>

			{/* List area */}
			<div className="flex-1 flex flex-col min-h-0">
				{view === "chats" ?
					<ChatsPanel searchQuery={search} />
				:	<ContactsPanel searchQuery={search} />}
			</div>

			{/* Footer: user info */}
			<div className="border-t border-border px-3 py-3 flex items-center gap-3">
				<Avatar className="h-8 w-8 flex-shrink-0">
					<AvatarImage src={user?.avatar} alt={user?.display_name} />
					<AvatarFallback className="bg-primary/20 text-primary text-xs">
						{initials}
					</AvatarFallback>
				</Avatar>
				<div className="flex-1 min-w-0">
					<p className="text-sm font-medium truncate">
						{user?.display_name ?? "…"}
					</p>
					<p className="text-xs text-muted-foreground truncate">
						{user?.email ?? ""}
					</p>
				</div>
				<div className="flex items-center gap-1">
					<Tooltip>
						<TooltipTrigger asChild>
							<Button variant="ghost" size="icon" className="h-7 w-7">
								<Settings className="h-4 w-4" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>Settings</TooltipContent>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="h-7 w-7 text-muted-foreground hover:text-destructive"
								onClick={logout}>
								<LogOut className="h-4 w-4" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>Sign out</TooltipContent>
					</Tooltip>
				</div>
			</div>
		</div>
	);

	return (
		<>
			{/* Mobile toggle button */}
			<Button
				variant="ghost"
				size="icon"
				className="fixed top-3 left-3 z-50 md:hidden"
				onClick={() => setMobileOpen(true)}>
				<Menu className="h-5 w-5" />
			</Button>

			{/* Mobile overlay */}
			<AnimatePresence>
				{mobileOpen && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 z-40 bg-black/60 md:hidden"
						onClick={() => setMobileOpen(false)}
					/>
				)}
			</AnimatePresence>

			{/* Desktop sidebar (always visible) */}
			<aside className="hidden md:flex flex-col w-72 flex-shrink-0 bg-sidebar border-r border-border h-screen">
				{sidebarContent}
			</aside>

			{/* Mobile sidebar (slide in) */}
			<AnimatePresence>
				{mobileOpen && (
					<motion.aside
						initial={{ x: -288 }}
						animate={{ x: 0 }}
						exit={{ x: -288 }}
						transition={{ type: "spring", stiffness: 300, damping: 30 }}
						className="fixed left-0 top-0 z-50 flex flex-col w-72 bg-sidebar border-r border-border h-screen md:hidden">
						{sidebarContent}
					</motion.aside>
				)}
			</AnimatePresence>
		</>
	);
}
