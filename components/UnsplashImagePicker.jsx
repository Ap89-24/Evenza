"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Check, Image as ImageIcon, Loader2, Search, UploadCloud } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

export function UnsplashImagePicker({ IsOpen, OnClose, OnSelect }) {
  const [activeTab, setActiveTab] = useState("unsplash");
  const [query, setQuery] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Local Upload State
  const [localPreview, setLocalPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  // API call for searching Unsplash images
  const searchImages = async (searchQuery) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const accessKey = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY || "demo";
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
          searchQuery
        )}&per_page=30&client_id=${accessKey}`
      );
      const data = await response.json();
      setImages(data.results || []);
    } catch (error) {
      console.error("Error fetching images from Unsplash:", error);
      toast.error("Could not fetch Unsplash images.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    searchImages(query);
  };

  // Local Device File Selection Handler
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (PNG, JPG, WEBP).");
      return;
    }

    // Limit file size to 5MB for fast encoding
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file is too large. Please select an image under 5MB.");
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      setLocalPreview(reader.result);
      setUploading(false);
    };
    reader.onerror = () => {
      toast.error("Failed to read image file.");
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectLocal = () => {
    if (!localPreview) return;
    OnSelect(localPreview);
    OnClose();
  };

  return (
    <Dialog open={IsOpen} onOpenChange={OnClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] border-zinc-800 bg-zinc-950 text-white overflow-hidden flex flex-col p-6">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-xl font-bold">Choose Cover Image</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="bg-zinc-900 border border-zinc-800 p-1 mb-4">
            <TabsTrigger value="unsplash" className="gap-2 text-xs sm:text-sm">
              <Search className="w-4 h-4 text-purple-400" /> Search Unsplash
            </TabsTrigger>
            <TabsTrigger value="local" className="gap-2 text-xs sm:text-sm">
              <UploadCloud className="w-4 h-4 text-pink-400" /> Upload from Device
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: UNSPLASH SEARCH */}
          <TabsContent value="unsplash" className="flex-1 flex flex-col overflow-hidden space-y-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search high-res photos on Unsplash..."
                className="flex-1 bg-zinc-900 border-zinc-800"
              />
              <Button type="submit" disabled={loading} className="bg-purple-600 hover:bg-purple-700">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              </Button>
            </form>

            <div className="flex-1 overflow-y-auto min-h-[300px] border border-zinc-800/60 rounded-xl p-4 bg-zinc-900/40">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {images.map((image) => (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() => {
                        OnSelect(image.urls.regular);
                        OnClose();
                      }}
                      className="relative aspect-video overflow-hidden rounded-xl border-2 border-transparent hover:border-purple-500 hover:scale-105 transition-all group"
                    >
                      <Image
                        src={image.urls.small}
                        alt={image.description || "Unsplash Image"}
                        className="w-full h-full object-cover"
                        width={300}
                        height={200}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Check className="w-6 h-6 text-white" />
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {!loading && images.length === 0 && (
                <div className="text-center text-muted-foreground py-20 text-sm">
                  Type a keyword above (e.g. &quot;tech conference&quot;, &quot;music concert&quot;, &quot;art festival&quot;) and press search.
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Photos provided by{" "}
              <a
                href="https://unsplash.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-purple-400"
              >
                Unsplash
              </a>
            </p>
          </TabsContent>

          {/* TAB 2: UPLOAD FROM LOCAL DEVICE */}
          <TabsContent value="local" className="flex-1 flex flex-col overflow-hidden space-y-4">
            <div className="flex-1 border-2 border-dashed border-zinc-700 hover:border-purple-500 rounded-2xl p-8 bg-zinc-900/30 flex flex-col items-center justify-center text-center transition-colors relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />

              {localPreview ? (
                <div className="space-y-4 w-full max-w-md z-20">
                  <div className="relative aspect-video w-full rounded-xl overflow-hidden border-2 border-purple-500 shadow-xl">
                    <Image
                      src={localPreview}
                      alt="Local Upload Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <p className="text-xs text-emerald-400 font-semibold flex items-center justify-center gap-1">
                    <Check className="w-4 h-4" /> Ready to use as cover image!
                  </p>
                  <Button
                    onClick={handleSelectLocal}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold"
                  >
                    Set as Cover Image
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 pointer-events-none">
                  <div className="w-16 h-16 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
                    {uploading ? (
                      <Loader2 className="w-8 h-8 animate-spin" />
                    ) : (
                      <ImageIcon className="w-8 h-8" />
                    )}
                  </div>
                  <div>
                    <p className="text-base font-bold text-white">
                      Click to upload or drag & drop an image
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Supports PNG, JPG, JPEG, WEBP (Max 5MB)
                    </p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
