import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { X, Save } from "lucide-react";

const categories = [
  { value: "beef", label: "Beef" },
  { value: "pork", label: "Pork" },
  { value: "lamb", label: "Lamb" },
  { value: "poultry", label: "Poultry" },
  { value: "specialty", label: "Specialty" },
  { value: "sausages", label: "Sausages" }
];

const grades = [
  { value: "prime", label: "Prime" },
  { value: "choice", label: "Choice" },
  { value: "select", label: "Select" },
  { value: "organic", label: "Organic" },
  { value: "grass-fed", label: "Grass-Fed" }
];

export default function ProductForm({ product, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(product || {
    name: "",
    category: "",
    cut_type: "",
    price_per_pound: 0,
    stock_pounds: 0,
    description: "",
    origin: "",
    grade: "",
    is_featured: false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-amber-200">
        <CardHeader className="border-b border-amber-200/50">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-bold text-amber-900">
              {product ? 'Edit Product' : 'Add New Product'}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g., Ribeye Steak"
                  required
                  className="border-amber-300 focus:border-amber-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => handleChange('category', value)}
                  required
                >
                  <SelectTrigger className="border-amber-300 focus:border-amber-500">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cut_type">Cut Type</Label>
                <Input
                  id="cut_type"
                  value={formData.cut_type}
                  onChange={(e) => handleChange('cut_type', e.target.value)}
                  placeholder="e.g., Bone-in, Boneless"
                  className="border-amber-300 focus:border-amber-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="grade">Grade</Label>
                <Select 
                  value={formData.grade} 
                  onValueChange={(value) => handleChange('grade', value)}
                >
                  <SelectTrigger className="border-amber-300 focus:border-amber-500">
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {grades.map((grade) => (
                      <SelectItem key={grade.value} value={grade.value}>
                        {grade.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price per Pound ($) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price_per_pound}
                  onChange={(e) => handleChange('price_per_pound', parseFloat(e.target.value) || 0)}
                  required
                  className="border-amber-300 focus:border-amber-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="stock">Stock (pounds) *</Label>
                <Input
                  id="stock"
                  type="number"
                  step="0.1"
                  value={formData.stock_pounds}
                  onChange={(e) => handleChange('stock_pounds', parseFloat(e.target.value) || 0)}
                  required
                  className="border-amber-300 focus:border-amber-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="origin">Origin/Source</Label>
              <Input
                id="origin"
                value={formData.origin}
                onChange={(e) => handleChange('origin', e.target.value)}
                placeholder="e.g., Local Farm, Nebraska"
                className="border-amber-300 focus:border-amber-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Product description, cooking tips, etc."
                rows={3}
                className="border-amber-300 focus:border-amber-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="featured"
                checked={formData.is_featured}
                onCheckedChange={(checked) => handleChange('is_featured', checked)}
              />
              <Label htmlFor="featured">Featured Product</Label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-amber-200/50">
              <Button variant="outline" onClick={onCancel} type="button">
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-700 hover:to-red-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                {product ? 'Update Product' : 'Add Product'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}