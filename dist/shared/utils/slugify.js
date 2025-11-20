"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slugify = slugify;
exports.humanizeCode = humanizeCode;
const DEFAULT_SEPARATOR = "-";
const ACCENT_CHAR_MAP = {
    á: "a",
    à: "a",
    ả: "a",
    ã: "a",
    ạ: "a",
    ă: "a",
    ắ: "a",
    ằ: "a",
    ẳ: "a",
    ẵ: "a",
    ặ: "a",
    â: "a",
    ấ: "a",
    ầ: "a",
    ẩ: "a",
    ẫ: "a",
    ậ: "a",
    đ: "d",
    é: "e",
    è: "e",
    ẻ: "e",
    ẽ: "e",
    ẹ: "e",
    ê: "e",
    ế: "e",
    ề: "e",
    ể: "e",
    ễ: "e",
    ệ: "e",
    í: "i",
    ì: "i",
    ỉ: "i",
    ĩ: "i",
    ị: "i",
    ó: "o",
    ò: "o",
    ỏ: "o",
    õ: "o",
    ọ: "o",
    ô: "o",
    ố: "o",
    ồ: "o",
    ổ: "o",
    ỗ: "o",
    ộ: "o",
    ơ: "o",
    ớ: "o",
    ờ: "o",
    ở: "o",
    ỡ: "o",
    ợ: "o",
    ú: "u",
    ù: "u",
    ủ: "u",
    ũ: "u",
    ụ: "u",
    ư: "u",
    ứ: "u",
    ừ: "u",
    ử: "u",
    ữ: "u",
    ự: "u",
    ý: "y",
    ỳ: "y",
    ỷ: "y",
    ỹ: "y",
    ỵ: "y",
};
/**
 * Convert arbitrary text into a safe slug/code.
 */
function slugify(input, options) {
    if (!input)
        return "";
    const separator = options?.separator ?? DEFAULT_SEPARATOR;
    const maxLength = options?.maxLength;
    const normalized = input
        .trim()
        .toLowerCase()
        .split("")
        .map((char) => ACCENT_CHAR_MAP[char] ?? char)
        .join("");
    const slug = normalized
        .replace(/[^a-z0-9]+/g, separator)
        .replace(new RegExp(`${separator}+`, "g"), separator)
        .replace(new RegExp(`^${separator}|${separator}$`, "g"), "");
    if (!maxLength || slug.length <= maxLength)
        return slug;
    return slug.slice(0, maxLength);
}
function humanizeCode(code) {
    if (!code)
        return "";
    return code
        .split(/[-_]/)
        .filter(Boolean)
        .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
        .join(" ");
}
