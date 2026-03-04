const EMOTICON_MAP: Record<string, string> = {
	// Smileys
	":)": "😊",
	":-)": "😊",
	"=)": "😊",
	"(:": "🙃",
	"(:-": "🙃",
	":D": "😃",
	":-D": "😃",
	"=D": "😃",
	":P": "😛",
	":-P": "😛",
	"=P": "😛",
	":p": "😛",
	":-p": "😛",
	"=p": "😛",
	":b": "😛",
	";)": "😉",
	";-)": "😉",
	">:)": "😈",
	">:-)": "😈",
	"X)": "😆",
	"X-)": "😆",
	xD: "😆",
	"B)": "😎",
	"B-)": "😎",
	"8)": "😎",
	"8-)": "😎",
	":*": "😘",
	":-*": "😘",
	"=*": "😘",
	":|": "😐",
	":-|": "😐",
	"=|": "😐",
	":/": "😕",
	":-/": "😕",
	"=/": "😕",
	":\\": "😕",
	":-\\": "😕",
	"=\\": "😕",
	":s": "😟",
	":-s": "😟",
	"=s": "😟",
	":S": "😟",
	":-S": "😟",
	"=S": "😟",
	":(": "😢",
	":-(": "😢",
	"=(": "😢",
	":'(": "😭",
	":'-(": "😭",
	"=*(": "😭",
	">:(": "😠",
	">:-(": "😠",
	":@": "😡",
	":-@": "😡",
	"=@": "😡",
	":o": "😮",
	":-o": "😮",
	"=o": "😮",
	":O": "😮",
	":-O": "😮",
	"=O": "😮",
	":>": "😄",
	":->": "😄",
	"=>": "😄",
	"<3": "❤️",
	"</3": "💔",
	"<\\3": "💔",

	// Gestures
	":thumbsup:": "👍",
	":thumbsdown:": "👎",
	":ok:": "👌",
	":victory:": "✌️",
	":fingerscrossed:": "🤞",
	":rock:": "🤘",
	":call:": "🤙",
	":pointleft:": "👈",
	":pointright:": "👉",
	":pointup:": "👆",
	":pointdown:": "👇",
	":fist:": "✊",
	":punch:": "👊",
	":hightouch:": "🙏",
	":wave:": "👋",
	":clap:": "👏",
	":muscle:": "💪",
};

/**
 * Parses text and converts emoticons to emoji
 * @param text The input text to parse
 * @returns The text with emoticons converted to emoji
 */
export function parseEmoticons(text: string): string {
	let result = text;

	// Sort emoticons by length (longer ones first) to avoid partial matches
	const sortedEmoticons = Object.keys(EMOTICON_MAP).sort(
		(a, b) => b.length - a.length,
	);

	for (const emoticon of sortedEmoticons) {
		const regex = new RegExp(escapeRegExp(emoticon), "g");
		result = result.replace(regex, EMOTICON_MAP[emoticon]);
	}

	return result;
}

/**
 * Escapes special regex characters in a string
 */
function escapeRegExp(string: string): string {
	return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Checks if a string contains any emoticons
 */
export function hasEmoticons(text: string): boolean {
	const emoticonPattern = new RegExp(
		Object.keys(EMOTICON_MAP).map(escapeRegExp).join("|"),
	);
	return emoticonPattern.test(text);
}
