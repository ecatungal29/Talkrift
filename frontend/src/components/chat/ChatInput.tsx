"use client";

import { useState, useRef, useCallback } from "react";
import { Send, Smile, Paperclip, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmojiPicker } from "./EmojiPicker";

interface Props {
	onSend: (content: string, file?: File) => void;
	onTyping: (isTyping: boolean) => void;
}

export function ChatInput({ onSend, onTyping }: Props) {
	const [value, setValue] = useState("");
	const [showEmojiPicker, setShowEmojiPicker] = useState(false);
	const [pendingFile, setPendingFile] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const isTypingRef = useRef(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleEmojiSelect = useCallback((emoji: string) => {
		setValue((prev) => prev + emoji);
	}, []);

	const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setPendingFile(file);
		if (file.type.startsWith("image/")) {
			setPreviewUrl(URL.createObjectURL(file));
		} else {
			setPreviewUrl(null);
		}
		// Reset input so same file can be reselected
		e.target.value = "";
	}, []);

	const clearFile = useCallback(() => {
		setPendingFile(null);
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		setPreviewUrl(null);
	}, [previewUrl]);

	const handleSend = useCallback(() => {
		const trimmed = value.trim();
		if (!trimmed && !pendingFile) return;
		onSend(trimmed, pendingFile ?? undefined);
		setValue("");
		setShowEmojiPicker(false);
		clearFile();
		if (isTypingRef.current) {
			onTyping(false);
			isTypingRef.current = false;
		}
		if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
	}, [value, pendingFile, onSend, onTyping, clearFile]);

	const handleChange = useCallback(
		(e: React.ChangeEvent<HTMLTextAreaElement>) => {
			setValue(e.target.value);
			if (!isTypingRef.current) {
				isTypingRef.current = true;
				onTyping(true);
			}
			if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
			typingTimeoutRef.current = setTimeout(() => {
				isTypingRef.current = false;
				onTyping(false);
			}, 2000);
		},
		[onTyping],
	);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
			if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();
				handleSend();
			}
		},
		[handleSend],
	);

	return (
		<div className="border-t border-border px-4 py-3 flex flex-col gap-2 flex-shrink-0 relative">
			{/* File preview */}
			{pendingFile && (
				<div className="flex items-center gap-2 bg-accent rounded-lg px-3 py-2">
					{previewUrl ? (
						<img src={previewUrl} alt="preview" className="h-12 w-12 rounded object-cover flex-shrink-0" />
					) : (
						<FileText className="h-8 w-8 text-primary flex-shrink-0" />
					)}
					<span className="text-sm truncate flex-1">{pendingFile.name}</span>
					<Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={clearFile}>
						<X className="h-3.5 w-3.5" />
					</Button>
				</div>
			)}

			<div className="flex gap-2 items-end">
				<Button
					variant="ghost"
					size="icon"
					onClick={() => setShowEmojiPicker(!showEmojiPicker)}
					className="h-10 w-10 flex-shrink-0">
					<Smile className="h-4 w-4" />
				</Button>
				<Button
					variant="ghost"
					size="icon"
					onClick={() => fileInputRef.current?.click()}
					className="h-10 w-10 flex-shrink-0">
					<Paperclip className="h-4 w-4" />
				</Button>
				<input
					ref={fileInputRef}
					type="file"
					accept="image/*,.pdf,.doc,.docx,.txt,.zip"
					className="hidden"
					onChange={handleFileChange}
				/>
				<textarea
					value={value}
					onChange={handleChange}
					onKeyDown={handleKeyDown}
					placeholder="Message…"
					rows={1}
					className="flex-1 resize-none min-h-[40px] max-h-[120px] bg-accent border-0 rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
					style={{ height: "auto" }}
					onInput={(e) => {
						const el = e.currentTarget;
						el.style.height = "auto";
						el.style.height = Math.min(el.scrollHeight, 120) + "px";
					}}
				/>
				<Button
					size="icon"
					onClick={handleSend}
					disabled={!value.trim() && !pendingFile}
					className="h-10 w-10 flex-shrink-0">
					<Send className="h-4 w-4" />
				</Button>
			</div>
			<EmojiPicker
				isOpen={showEmojiPicker}
				onClose={() => setShowEmojiPicker(false)}
				onEmojiSelect={handleEmojiSelect}
			/>
		</div>
	);
}
