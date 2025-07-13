"use client"
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@radix-ui/react-label";
import { Separator } from "@radix-ui/react-separator";
import { Settings } from "lucide-react";
import { PageData } from "../page";

export default function SEOTab({
  pageData,
  handleInputChange,
}: {
  pageData: PageData;
  handleInputChange: any;
}) {
  return (
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
              onChange={(e) => handleInputChange("meta_title", e.target.value)}
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
  );
}
