"use client";

import { useState, useEffect } from "react";
import { Save, Eye, FileText, Settings,  Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/lib/hooks/use-toast";
import { createPage, updatePage, getPages } from "@/lib/cms-service";
import Editor from "./_components/Editor";
import SEOTab from "./_components/seo";
import Manage from "./_components/Manage";
import Preview from "./_components/LivePreview";

export interface PageData {
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
    <div className="min-h-screen bg-gray-50 p-4 mt-10">
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
          <Editor
            wordCount={wordCount}
            pageData={pageData}
            handleInputChange={handleInputChange}
          />

          {/* SEO Tab */}
          <SEOTab pageData={pageData} handleInputChange={handleInputChange} />

          {/* Preview Tab */}
          <Preview wordCount={wordCount} pageData={pageData} />

          {/* Manage Tab */}
          <Manage savedPages={savedPages} handleLoadPage={handleLoadPage} />
        </Tabs>
      </div>
    </div>
  );
}
