/** Whether a content language tag (e.g. 'zh', 'zh-CN') is Chinese. */
export function isCJKLanguage(language: string): boolean {
  return language.startsWith('zh');
}
