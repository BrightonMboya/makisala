"use client"
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageData } from "../page";

export default function Preview({pageData, wordCount}: {pageData: PageData, wordCount: number}) {
  return (
    <TabsContent value="preview" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Eye className="h-5 w-5" />
            <span>Full Page Preview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-white border rounded-lg p-8 shadow-sm">
            <article className="max-w-4xl mx-auto">
              {pageData.featured_image && (
                <div className="mb-8">
                  <img
                    src={pageData.featured_image || "/placeholder.svg"}
                    alt={pageData.title}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
              )}

              <header className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  {pageData.title || "Page Title"}
                </h1>
                {pageData.excerpt && (
                  <p className="text-xl text-gray-600 leading-relaxed">
                    {pageData.excerpt}
                  </p>
                )}
                <div className="flex items-center space-x-4 mt-4 text-sm text-gray-500">
                  <Badge
                    variant={
                      pageData.status === "published" ? "default" : "secondary"
                    }>
                    {pageData.status}
                  </Badge>
                  <span>
                    {pageData.page_type === "blog" ? "Blog Post" : "Page"}
                  </span>
                  <span>{wordCount} words</span>
                </div>
              </header>

              <MarkdownRenderer
                content={
                  pageData.content ||
                  "*No content yet. Start writing in the editor tab.*"
                }
              />
            </article>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}