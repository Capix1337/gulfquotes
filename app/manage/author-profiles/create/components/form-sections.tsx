import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";
import { CreateAuthorProfileInput } from "@/schemas/author-profile";
import { CreateImageUpload } from "./image-upload"; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FormSectionsProps {
  form: UseFormReturn<CreateAuthorProfileInput>;
  disabled?: boolean;
}

export function FormSections({ form, disabled }: FormSectionsProps) {
  // Generate arrays for days, months, and years for the select fields
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1500 + 1 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-6">
      {/* Basic Info Section */}
      <div className="space-y-4">
        <div className="text-lg font-semibold">Basic Information</div>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input disabled={disabled} placeholder="Author's name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug</FormLabel>
              <FormControl>
                <Input disabled={disabled} placeholder="URL-friendly slug" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Life Details Section */}
      <div className="space-y-4">
        <div className="text-lg font-semibold">Life Details</div>
        
        {/* Keep existing string field for backward compatibility */}
        <FormField
          control={form.control}
          name="born"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Birth Information (Legacy Format)</FormLabel>
              <FormControl>
                <Input 
                  disabled={disabled} 
                  placeholder="e.g., Born in Dublin, Ireland - October 16, 1854" 
                  {...field}
                  value={field.value ?? ''} // Convert null to empty string
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* New structured birth fields */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Birth Date (New Format)</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Birth Day */}
            <FormField
              control={form.control}
              name="bornDay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Day</FormLabel>
                  <Select
                    disabled={disabled}
                    onValueChange={(value) => {
                      if (value === "placeholder") {
                        field.onChange(null);
                      } else {
                        field.onChange(parseInt(value));
                      }
                    }}
                    value={field.value?.toString() || "placeholder"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Day" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="placeholder" disabled>Select a day</SelectItem>
                      {days.map((day) => (
                        <SelectItem key={`born-day-${day}`} value={day.toString()}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Birth Month */}
            <FormField
              control={form.control}
              name="bornMonth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Month</FormLabel>
                  <Select
                    disabled={disabled}
                    onValueChange={(value) => {
                      if (value === "placeholder") {
                        field.onChange(null);
                      } else {
                        field.onChange(parseInt(value));
                      }
                    }}
                    value={field.value?.toString() || "placeholder"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Month" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="placeholder" disabled>Select a month</SelectItem>
                      {months.map((month) => (
                        <SelectItem key={`born-month-${month.value}`} value={month.value.toString()}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Birth Year */}
            <FormField
              control={form.control}
              name="bornYear"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Year</FormLabel>
                  <Select
                    disabled={disabled}
                    onValueChange={(value) => {
                      if (value === "placeholder") {
                        field.onChange(null);
                      } else {
                        field.onChange(parseInt(value));
                      }
                    }}
                    value={field.value?.toString() || "placeholder"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Year" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-60 overflow-auto">
                      <SelectItem value="placeholder" disabled>Select a year</SelectItem>
                      {years.map((year) => (
                        <SelectItem key={`born-year-${year}`} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Birth Place */}
        <FormField
          control={form.control}
          name="birthPlace"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Birth Place</FormLabel>
              <FormControl>
                <Input 
                  disabled={disabled} 
                  placeholder="e.g., Dublin, Ireland" 
                  {...field}
                  value={field.value ?? ''} // Convert null to empty string
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Keep existing string field for backward compatibility */}
        <FormField
          control={form.control}
          name="died"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Death Information (Legacy Format)</FormLabel>
              <FormControl>
                <Input 
                  disabled={disabled} 
                  placeholder="e.g., November 30, 1900" 
                  {...field}
                  value={field.value ?? ''} // Convert null to empty string
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* New structured death fields */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Death Date (New Format)</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Death Day */}
            <FormField
              control={form.control}
              name="diedDay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Day</FormLabel>
                  <Select
                    disabled={disabled}
                    onValueChange={(value) => {
                      if (value === "placeholder") {
                        field.onChange(null);
                      } else {
                        field.onChange(parseInt(value));
                      }
                    }}
                    value={field.value?.toString() || "placeholder"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Day" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="placeholder" disabled>Select a day</SelectItem>
                      {days.map((day) => (
                        <SelectItem key={`died-day-${day}`} value={day.toString()}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Death Month */}
            <FormField
              control={form.control}
              name="diedMonth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Month</FormLabel>
                  <Select
                    disabled={disabled}
                    onValueChange={(value) => {
                      if (value === "placeholder") {
                        field.onChange(null);
                      } else {
                        field.onChange(parseInt(value));
                      }
                    }}
                    value={field.value?.toString() || "placeholder"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Month" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="placeholder" disabled>Select a month</SelectItem>
                      {months.map((month) => (
                        <SelectItem key={`died-month-${month.value}`} value={month.value.toString()}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Death Year */}
            <FormField
              control={form.control}
              name="diedYear"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Year</FormLabel>
                  <Select
                    disabled={disabled}
                    onValueChange={(value) => {
                      if (value === "placeholder") {
                        field.onChange(null);
                      } else {
                        field.onChange(parseInt(value));
                      }
                    }}
                    value={field.value?.toString() || "placeholder"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Year" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-60 overflow-auto">
                      <SelectItem value="placeholder" disabled>Select a year</SelectItem>
                      {years.map((year) => (
                        <SelectItem key={`died-year-${year}`} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="influences"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Influences</FormLabel>
              <FormControl>
                <Input 
                  disabled={disabled} 
                  placeholder="Comma-separated list of influences" 
                  {...field}
                  value={field.value ?? ''} // Convert null to empty string
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Biography Section */}
      <div className="space-y-4">
        <div className="text-lg font-semibold">Biography</div>
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Biography</FormLabel>
              <FormControl>
                <Textarea 
                  disabled={disabled} 
                  placeholder="Author's biography" 
                  className="h-32"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* External Resources Section */}
      <div className="space-y-4">
        <div className="text-lg font-semibold">External Resources</div>
        <p className="text-sm text-muted-foreground">
          Add an external link for users to learn more about this author
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* External Link Title */}
          <FormField
            control={form.control}
            name="externalLinkTitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Link Title</FormLabel>
                <FormControl>
                  <Input 
                    disabled={disabled} 
                    placeholder="e.g., Official Website, Wikipedia, Read more" 
                    {...field}
                    value={field.value ?? ''} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* External Link URL */}
          <FormField
            control={form.control}
            name="externalLinkUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Link URL</FormLabel>
                <FormControl>
                  <Input 
                    disabled={disabled} 
                    placeholder="https://example.com" 
                    {...field}
                    value={field.value ?? ''} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Both title and URL must be provided to display the external link on the author&apos;s page
        </p>
      </div>

      {/* Image upload section */}
      <CreateImageUpload 
        form={form} 
        disabled={disabled} 
      />
    </div>
  );
}