import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, ShoppingCart, Star, ChefHat } from "lucide-react";

export default function CutModal({ cut, onClose, onAddToCart }) {
  const [quantity, setQuantity] = useState(1);

  const getTendernessBadge = (tenderness) => {
    const config = {
      very_tender: { label: "Very Tender", color: "bg-green-100 text-green-800" },
      tender: { label: "Tender", color: "bg-blue-100 text-blue-800" },
      moderate: { label: "Moderate", color: "bg-yellow-100 text-yellow-800" },
      tough: { label: "Tough", color: "bg-red-100 text-red-800" }
    };
    return config[tenderness] || config.moderate;
  };

  const handleAddToCart = () => {
    onAddToCart(cut, quantity);
  };

  const totalPrice = (cut.price_per_pound * quantity).toFixed(2);
  const tenderness = getTendernessBadge(cut.tenderness);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900 flex items-center">
                {cut.name}
                <Star className="w-6 h-6 ml-2 text-yellow-500" />
              </CardTitle>
              <div className="flex space-x-2 mt-2">
                <Badge className={tenderness.color}>
                  {tenderness.label}
                </Badge>
                <Badge variant="outline">
                  ${cut.price_per_pound}/lb
                </Badge>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          {/* Cut Image Placeholder */}
          <div className="w-full h-48 bg-gradient-to-r from-red-100 to-red-200 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <ChefHat className="w-16 h-16 mx-auto text-red-400 mb-2" />
              <p className="text-red-600 font-medium">{cut.name}</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-600">{cut.description}</p>
          </div>

          {/* Cooking Method */}
          {cut.cooking_method && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Best Cooking Method</h3>
              <p className="text-gray-600">{cut.cooking_method}</p>
            </div>
          )}

          {/* Quantity Selection */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Quantity</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="quantity">Pounds</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={quantity}
                  onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
                  className="text-lg"
                />
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Price per pound</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${cut.price_per_pound}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Total price</p>
                <p className="text-3xl font-bold text-red-600">
                  ${totalPrice}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="border-t pt-6">
            <div className="flex space-x-4">
              <Button 
                variant="outline" 
                onClick={onClose}
                className="flex-1"
              >
                Continue Shopping
              </Button>
              <Button 
                onClick={handleAddToCart}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Add to Cart - ${totalPrice}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}