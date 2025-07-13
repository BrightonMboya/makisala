import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@radix-ui/react-label";
import { FileText, ImageIcon, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { type PageData } from "../page";

interface EditorProps {
  wordCount: number;
  pageData: PageData;
  handleInputChange: any;
}

export default function Editor({
  wordCount,
  pageData,
  handleInputChange,
}: EditorProps) {
  return (
    <TabsContent value="editor" className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Content Editor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Content Editor</span>
              <Badge variant="secondary">{wordCount} words</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="page-type">Content Type</Label>
                <Select
                  value={pageData.page_type}
                  onValueChange={(value: "page" | "blog") =>
                    handleInputChange("page_type", value)
                  }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="page">Page</SelectItem>
                    <SelectItem value="blog">Blog Post</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={pageData.status}
                  onValueChange={(value: "draft" | "published") =>
                    handleInputChange("status", value)
                  }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={pageData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Enter page title..."
              />
            </div>

            <div>
              <Label htmlFor="slug">URL Slug</Label>
              <Input
                id="slug"
                value={pageData.slug}
                onChange={(e) => handleInputChange("slug", e.target.value)}
                placeholder="url-slug"
              />
              <p className="text-sm text-gray-500 mt-1">
                URL: /safari/
                {pageData.page_type === "blog" ? "blog" : "pages"}/
                {pageData.slug}
              </p>
            </div>

            <div>
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                value={pageData.excerpt}
                onChange={(e) => handleInputChange("excerpt", e.target.value)}
                placeholder="Brief description of the content..."
                rows={3}
              />
            </div>

            <div>
              <Label
                htmlFor="featured-image"
                className="flex items-center space-x-2">
                <ImageIcon className="h-4 w-4" />
                <span>Featured Image URL</span>
              </Label>
              <Input
                id="featured-image"
                value={pageData.featured_image}
                onChange={(e) =>
                  handleInputChange("featured_image", e.target.value)
                }
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div>
              <Label htmlFor="content">Content (Markdown)</Label>
              <Textarea
                id="content"
                value={pageData.content}
                onChange={(e) => handleInputChange("content", e.target.value)}
                placeholder="Write your content in Markdown..."
                rows={20}
                className="font-mono text-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Live Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Eye className="h-5 w-5" />
              <span>Live Preview</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              {pageData.featured_image && (
                <img
                  src={pageData.featured_image || "/placeholder.svg"}
                  alt={pageData.title}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}
              {pageData.title && (
                <h1 className="text-2xl font-bold mb-4">{pageData.title}</h1>
              )}
              {pageData.excerpt && (
                <p className="text-gray-600 italic mb-6">{pageData.excerpt}</p>
              )}
              <MarkdownRenderer content={pageData.content || ""} />
            </div>
          </CardContent>
        </Card>
      </div>
    </TabsContent>
  );
}
