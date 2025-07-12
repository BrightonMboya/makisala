"use client";

import { useState, useEffect } from "react";
import { Save, Eye, FileText, Settings, ImageIcon, Globe } from "lucide-react";
import ReactMarkdown from "react-markdown";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/lib/hooks/use-toast";
import { createPage, updatePage, getPages } from "@/lib/db";
import { MarkdownRenderer } from "@/components/markdown-renderer";

interface PageData {
  id?: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  status: "draft" | "published";
  page_type: "page" | "blog";
  created_at?: string;
  updated_at?: string;
}

export default function CMSPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("editor");
  const [isLoading, setIsLoading] = useState(false);
  const [savedPages, setSavedPages] = useState<PageData[]>([]);

  const [pageData, setPageData] = useState<PageData>({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    featured_image: "",
    meta_title: "",
    meta_description: "",
    meta_keywords: "",
    status: "draft",
    page_type: "page",
  });

  // Auto-generate slug from title
  useEffect(() => {
    if (pageData.title && !pageData.slug) {
      const slug = pageData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setPageData((prev) => ({ ...prev, slug }));
    }
  }, [pageData.title, pageData.slug]);

  // Auto-generate meta title from title
  useEffect(() => {
    if (pageData.title && !pageData.meta_title) {
      setPageData((prev) => ({ ...prev, meta_title: pageData.title }));
    }
  }, [pageData.title, pageData.meta_title]);

  const handleInputChange = (field: keyof PageData, value: string) => {
    setPageData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      let savedPage: PageData;

      if (pageData.id) {
        // Update existing page
        savedPage = await updatePage(pageData.id, pageData);
      } else {
        // Create new page
        savedPage = await createPage(pageData);
      }

      // Update local state
      setPageData(savedPage);

      // Update saved pages list
      setSavedPages((prev) => {
        const existing = prev.findIndex((p) => p.id === savedPage.id);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = savedPage;
          return updated;
        }
        return [...prev, savedPage];
      });

      toast({
        title: "Success!",
        description: `${
          pageData.page_type === "blog" ? "Blog post" : "Page"
        } saved successfully.`,
      });
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "Error",
        description: "Failed to save. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add useEffect to load saved pages on component mount
  useEffect(() => {
    const loadPages = async () => {
      try {
        const pages = await getPages();
        setSavedPages(pages);
      } catch (error) {
        console.error("Failed to load pages:", error);
      }
    };
    loadPages();
  }, []);

  const handleLoadPage = (page: PageData) => {
    setPageData(page);
    setActiveTab("editor");
  };

  const handleNewPage = () => {
    setPageData({
      title: "",
      slug: "",
      content: "",
      excerpt: "",
      featured_image: "",
      meta_title: "",
      meta_description: "",
      meta_keywords: "",
      status: "draft",
      page_type: "page",
    });
    setActiveTab("editor");
  };

  const wordCount = pageData.content
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Content Management System
              </h1>
              <p className="text-gray-600 mt-2">
                Create and manage your safari website content
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={handleNewPage} variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                New Page
              </Button>
              <Button onClick={handleSave} disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="editor" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Editor</span>
            </TabsTrigger>
            <TabsTrigger value="seo" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>SEO & Meta</span>
            </TabsTrigger>
            <TabsTrigger
              value="preview"
              className="flex items-center space-x-2">
              <Eye className="h-4 w-4" />
              <span>Preview</span>
            </TabsTrigger>
            <TabsTrigger value="manage" className="flex items-center space-x-2">
              <Globe className="h-4 w-4" />
              <span>Manage</span>
            </TabsTrigger>
          </TabsList>

          {/* Editor Tab */}
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
                      onChange={(e) =>
                        handleInputChange("title", e.target.value)
                      }
                      placeholder="Enter page title..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="slug">URL Slug</Label>
                    <Input
                      id="slug"
                      value={pageData.slug}
                      onChange={(e) =>
                        handleInputChange("slug", e.target.value)
                      }
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
                      onChange={(e) =>
                        handleInputChange("excerpt", e.target.value)
                      }
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
                      onChange={(e) =>
                        handleInputChange("content", e.target.value)
                      }
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
                      <h1 className="text-2xl font-bold mb-4">
                        {pageData.title}
                      </h1>
                    )}
                    {pageData.excerpt && (
                      <p className="text-gray-600 italic mb-6">
                        {pageData.excerpt}
                      </p>
                    )}
                    <MarkdownRenderer content={pageData.content || ""} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* SEO Tab */}
          <TabsContent value="seo" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>SEO & Meta Data</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="meta-title">Meta Title</Label>
                  <Input
                    id="meta-title"
                    value={pageData.meta_title}
                    onChange={(e) =>
                      handleInputChange("meta_title", e.target.value)
                    }
                    placeholder="SEO optimized title..."
                    maxLength={60}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {pageData.meta_title.length}/60 characters
                  </p>
                </div>

                <div>
                  <Label htmlFor="meta-description">Meta Description</Label>
                  <Textarea
                    id="meta-description"
                    value={pageData.meta_description}
                    onChange={(e) =>
                      handleInputChange("meta_description", e.target.value)
                    }
                    placeholder="Brief description for search engines..."
                    rows={3}
                    maxLength={160}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {pageData.meta_description.length}/160 characters
                  </p>
                </div>

                <div>
                  <Label htmlFor="meta-keywords">Meta Keywords</Label>
                  <Input
                    id="meta-keywords"
                    value={pageData.meta_keywords}
                    onChange={(e) =>
                      handleInputChange("meta_keywords", e.target.value)
                    }
                    placeholder="safari, tanzania, wildlife, luxury travel"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Separate keywords with commas
                  </p>
                </div>

                <Separator />

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-3">Search Engine Preview</h3>
                  <div className="space-y-2">
                    <div className="text-blue-600 text-lg hover:underline cursor-pointer">
                      {pageData.meta_title || pageData.title || "Page Title"}
                    </div>
                    <div className="text-green-700 text-sm">
                      https://safarifrank.com/
                      {pageData.page_type === "blog" ? "blog" : "pages"}/
                      {pageData.slug || "page-url"}
                    </div>
                    <div className="text-gray-600 text-sm">
                      {pageData.meta_description ||
                        pageData.excerpt ||
                        "Page description will appear here..."}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preview Tab */}
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
                            pageData.status === "published"
                              ? "default"
                              : "secondary"
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

          {/* Manage Tab */}
          <TabsContent value="manage" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-5 w-5" />
                  <span>Manage Content</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {savedPages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>
                      No saved content yet. Create your first page or blog post!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {savedPages.map((page) => (
                      <div
                        key={page.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className="font-medium">{page.title}</h3>
                            <Badge
                              variant={
                                page.status === "published"
                                  ? "default"
                                  : "secondary"
                              }>
                              {page.status}
                            </Badge>
                            <Badge variant="outline">{page.page_type}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {page.excerpt}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            Last updated:{" "}
                            {page.updated_at
                              ? new Date(page.updated_at).toLocaleDateString()
                              : "Never"}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleLoadPage(page)}>
                            Edit
                          </Button>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
