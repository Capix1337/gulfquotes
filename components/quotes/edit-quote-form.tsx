"use client";

import { useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateQuoteSchema } from "@/schemas/quote";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { Quote, Category, AuthorProfile, Tag } from "@prisma/client";
import { useToast } from "@/hooks/use-toast";
import { Icons } from "@/components/ui/icons";
import { slugify } from "@/lib/utils";
import type { UpdateQuoteInput } from "@/schemas/quote";
import type { GalleryItem } from "@/types/gallery";
// import type { CloudinaryUploadResult } from "@/types/cloudinary";
import { TagInput } from "@/components/forms/TagInput";
import { TagManagementModal } from "@/components/forms/TagManagementModal";
import { QuoteGalleryModal } from "@/components/quotes/quote-gallery-modal";
import { ImagePlus } from "lucide-react";
// import { QuoteImageUpload } from "@/components/quotes/quote-image-upload";
import { QuoteImageGallery } from "@/components/quotes/quote-image-gallery";
import { Switch } from "../ui/switch";

interface SelectedImageState {
  imageUrl: string | null;
  publicId: string | null;
  isBackground: boolean;
}

interface EditQuoteFormProps {
  quote: Quote & {
    category: Category;
    authorProfile: AuthorProfile;
    gallery: {
      gallery: GalleryItem;
      isActive: boolean;
    }[];
    backgroundImage: string | null;
    tags: Tag[];
  };
  categories: Category[];
  authorProfiles: AuthorProfile[];
}

export function EditQuoteForm({ quote, categories, authorProfiles }: EditQuoteFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedTags, setSelectedTags] = useState<Tag[]>(quote.tags || []);
  const [charCount, setCharCount] = useState(quote.content.length);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isTagManagementOpen, setIsTagManagementOpen] = useState(false);
  // const [isUploading, setIsUploading] = useState(false);

  // Update the image state initialization
  const [selectedImage, setSelectedImage] = useState<SelectedImageState>({
    imageUrl: quote.backgroundImage,
    publicId: quote.gallery.find(g => g.isActive)?.gallery.publicId || null,
    isBackground: !!quote.backgroundImage
  });

  const [galleryImages, setGalleryImages] = useState<GalleryItem[]>(
    quote.gallery.map(g => ({
      ...g.gallery,
      isActive: g.isActive,
      isBackground: g.gallery.url === quote.backgroundImage
    }))
  );

  const form = useForm<UpdateQuoteInput>({
    resolver: zodResolver(updateQuoteSchema),
    defaultValues: {
      content: quote.content,
      slug: quote.slug,
      categoryId: quote.categoryId,
      authorProfileId: quote.authorProfileId,
      featured: quote.featured || false, // Add this line
    },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(data: UpdateQuoteInput) {
    try {
      const response = await fetch(`/api/quotes/${quote.slug}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          backgroundImage: selectedImage.imageUrl,
          galleryImages: galleryImages.map(img => ({
            id: img.id,
            isActive: img.url === selectedImage.imageUrl,
            isBackground: img.url === selectedImage.imageUrl
          })),
          tags: {
            // Format tags properly according to the schema
            connect: selectedTags.map(tag => ({ id: tag.id })),
            disconnect: quote.tags
              .filter(tag => !selectedTags.some(st => st.id === tag.id))
              .map(tag => ({ id: tag.id }))
          }
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error.message);
      }

      toast({
        title: "Success",
        description: "Quote updated successfully",
        variant: "default",
      });

      router.push("/manage/quotes");
      router.refresh();

    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    }
  }

  const handleAutoGenerateSlug = () => {
    const content = form.getValues("content");
    if (content) {
      const generatedSlug = slugify(content.substring(0, 50));
      form.setValue("slug", generatedSlug);
    } else {
      toast({
        title: "Error",
        description: "Please enter quote content first",
        variant: "destructive",
      });
    }
  };

  /*
  const handleImageUpload = async (result: CloudinaryUploadResult) => {
    if (result.event === "success" && result.info && typeof result.info !== 'string') {
      setIsUploading(false);
      
      const newImage: GalleryItem = {
        id: result.info.public_id,
        url: result.info.secure_url,
        publicId: result.info.public_id,
        format: result.info.format,
        width: result.info.width,
        height: result.info.height,
        bytes: result.info.bytes,
        isGlobal: true,
        title: '',
        description: '',
        altText: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0,
        isActive: !selectedImage.imageUrl,
        isBackground: !selectedImage.imageUrl
      };

      setGalleryImages(prev => [...prev, newImage]);

      if (!selectedImage.imageUrl) {
        setSelectedImage({
          imageUrl: newImage.url,
          publicId: newImage.publicId,
          isBackground: true
        });
        form.setValue('backgroundImage', newImage.url);
      }
    }
    setIsUploading(false);
  };
  */

  const handleImageSelect = (image: GalleryItem) => {
    setSelectedImage({
      imageUrl: image.url,
      publicId: image.publicId,
      isBackground: true
    });
    
    form.setValue('backgroundImage', image.url);

    setGalleryImages(prev => 
      prev.map(img => ({
        ...img,
        isActive: img.id === image.id,
        isBackground: img.url === image.url
      }))
    );
  };

  const handleImageDeselect = (imageId: string) => {
    const image = galleryImages.find(img => img.id === imageId);
    if (!image) return;

    if (image.url === selectedImage.imageUrl) {
      setSelectedImage({
        imageUrl: null,
        publicId: null,
        isBackground: false
      });
      form.setValue('backgroundImage', null);
    }

    setGalleryImages(prev => prev.filter(img => img.id !== imageId));
  };

  const handleGallerySelect = (selectedImages: GalleryItem[]) => {
    const newImages = selectedImages.filter(
      newImg => !galleryImages.some(img => img.id === newImg.id)
    );
    
    setGalleryImages(prev => {
      const updated = [...prev];
      newImages.forEach(newImg => {
        updated.push({
          ...newImg,
          isActive: false,
          isBackground: false
        });
      });
      return updated;
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quote Content</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <Textarea
                    {...field}
                    placeholder="Enter your quote here..."
                    onChange={(e) => {
                      field.onChange(e);
                      setCharCount(e.target.value.length);
                    }}
                    disabled={isSubmitting}
                    className="h-32 resize-none"
                  />
                  <div className={`text-sm text-right ${
                    charCount > 1500 ? "text-destructive" : "text-muted-foreground"
                  }`}>
                    {charCount}/1500 characters
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Slug Field */}
        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quote Slug</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Auto-generated or type a slug"
                    className="border border-gray-300 rounded p-2 flex-1"
                  />
                </FormControl>
                <Button type="button" onClick={handleAutoGenerateSlug}>
                  Auto-generate slug
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Author Profile Field */}
        <FormField
          control={form.control}
          name="authorProfileId"
          render={({ field }) => (
            <FormItem className="space-y-4">
              <div className="space-y-1">
                <FormLabel>Quote Author</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Select the original author of this quote
                </p>
              </div>
              
              <Select
                disabled={isSubmitting}
                onValueChange={field.onChange}
                value={field.value}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select an author" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {authorProfiles.map((author) => (
                    <SelectItem 
                      key={author.id} 
                      value={author.id}
                      className="cursor-pointer"
                    >
                      <div className="flex flex-col gap-1 py-1">
                        <span className="font-medium">{author.name}</span>
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {author.born && `${author.born}`}
                          {author.died && ` - ${author.died}`}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Author Preview */}
              {field.value && (
                <div className="rounded-lg border bg-card p-4">
                  {authorProfiles.map((author) => 
                    author.id === field.value ? (
                      <div key={author.id} className="space-y-2">
                        <h4 className="font-semibold">{author.name}</h4>
                        {(author.born || author.died) && (
                          <p className="text-sm text-muted-foreground">
                            {author.born && `Born: ${author.born}`}
                            {author.died && ` • Died: ${author.died}`}
                          </p>
                        )}
                        {author.bio && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {author.bio}
                          </p>
                        )}
                      </div>
                    ) : null
                  )}
                </div>
              )}

              <FormMessage />
            </FormItem>
          )}
        />

        {/* Category Field */}
        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select
                disabled={isSubmitting}
                onValueChange={field.onChange}
                value={field.value}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Featured Quote Toggle */}
        <FormField
          control={form.control}
          name="featured"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Featured Quote</FormLabel>
                <FormDescription>
                  Mark this quote to appear on the homepage and featured sections
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isSubmitting}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Tags Field */}
        <FormItem>
          <FormLabel>Tags</FormLabel>
          <div className="space-y-2">
            <div className="flex gap-2">
              <FormControl className="flex-1">
                <TagInput
                  selectedTags={selectedTags}
                  onTagsChange={setSelectedTags}
                  disabled={isSubmitting}
                  maxTags={10}
                />
              </FormControl>
              <Button 
                type="button"
                variant="outline"
                onClick={() => setIsTagManagementOpen(true)}
                disabled={isSubmitting}
              >
                Manage Tags
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Add up to 10 tags to categorize your quote
            </p>
          </div>
        </FormItem>

        {/* Gallery Section */}
        <div className="space-y-6 rounded-lg border bg-card">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <FormLabel className="text-base font-semibold">Quote Images</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Upload or select images for your quote background
                </p>
              </div>
              <Button
                type="button" 
                variant="outline"
                onClick={() => setIsGalleryOpen(true)}
                disabled={isSubmitting}
              >
                <ImagePlus className="h-4 w-4 mr-2" />
                Browse Gallery
              </Button>
            </div>
          </div>

          {/*
          <div className="p-6 border-b bg-muted/50">
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Quick Upload</h4>
              <QuoteImageUpload
                onUploadComplete={handleImageUpload}
                disabled={isSubmitting}
                isUploading={isUploading}
                maxFiles={30 - galleryImages.length}
              />
            </div>
          </div>
          */}

          <div className="p-6">
            <div className="space-y-4">
              {/* <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Selected Images</h4>
                <p className="text-sm text-muted-foreground">
                  {galleryImages.length} of 30 images
                </p>
              </div> */}

              <QuoteImageGallery
                items={galleryImages}
                selectedImage={selectedImage.imageUrl}
                currentlySelected={galleryImages.map(img => img.publicId)}
                maxSelectable={30}
                onSelect={handleImageSelect}
                onDeselect={handleImageDeselect}
                isBackground={true}
                disabled={isSubmitting}
              />

              {selectedImage.imageUrl && (
                <div className="mt-4 p-4 border rounded-lg bg-muted/50">
                  <h4 className="text-sm font-medium mb-3">Background Preview</h4>
                  <div className="relative aspect-[1.91/1] rounded-lg overflow-hidden">
                    <Image
                      src={selectedImage.imageUrl}
                      alt="Selected background"
                      className="object-cover"
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <QuoteGalleryModal
          isOpen={isGalleryOpen}
          onClose={() => setIsGalleryOpen(false)}
          onSelect={handleGallerySelect}
          maxSelectable={30 - galleryImages.length}
          currentlySelected={galleryImages.map(img => img.publicId)}
          title="Quote Background Gallery"
          description="Select images from the gallery to use as quote backgrounds"
        />

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isSubmitting ? "Updating..." : "Update Quote"}
          </Button>
        </div>
      </form>

      <TagManagementModal
        open={isTagManagementOpen}
        onOpenChange={setIsTagManagementOpen}
        onSuccess={() => {
          // Refresh tag suggestions in TagInput
        }}
      />
    </Form>
  );
}