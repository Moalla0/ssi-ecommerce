"use client";

import {
  Home,
  Inbox,
  Calendar,
  Search,
  Settings,
  User2,
  ChevronUp,
  Plus,
  Package,
  User,
  ShoppingBasket,
  Hash,
  Folder,
  X,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "./ui/sidebar";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import AddOrder from "./AddOrder";
import AddUser from "./AddUser";
import AddCategory from "./AddCategory";
import AddProduct from "./AddProduct";
import AddSubcategory from "./AddSubcategory";
import { getProducts } from "@/lib/products";
import { getAllUsers } from "@/lib/users";
import { getLatestOrders } from "@/lib/products";

const items = [
  {
    title: "Home",
    url: "/",
    icon: Home,
  },
  {
    title: "Inbox",
    url: "#",
    icon: Inbox,
  },
  {
    title: "Calendar",
    url: "#",
    icon: Calendar,
  },
  {
    title: "Search",
    url: "#",
    icon: Search,
  },
  {
    title: "Settings",
    url: "#",
    icon: Settings,
  },
];

const AppSidebar = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{
    products: any[];
    users: any[];
    orders: any[];
  }>({ products: [], users: [], orders: [] });
  const [isSearching, setIsSearching] = useState(false);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault();
        setIsSearchOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults({ products: [], users: [], orders: [] });
      return;
    }

    setIsSearching(true);
    try {
      const [{ products }, users, orders] = await Promise.all([
        getProducts(100), // Increase limit for search
        getAllUsers(),
        getLatestOrders(50), // Get more orders for search
      ]);

      // Normalize search query (remove accents and convert to lowercase)
      const normalizeText = (text: string) => {
        return text
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, ""); // Remove diacritics
      };

      const normalizedQuery = normalizeText(query);

      const filteredProducts = products.filter((product) => {
        const normalizedName = normalizeText(product.name || "");
        const normalizedCategory = normalizeText(product.category || "");
        const normalizedDescription = normalizeText(product.description || "");

        return (
          normalizedName.includes(normalizedQuery) ||
          normalizedCategory.includes(normalizedQuery) ||
          normalizedDescription.includes(normalizedQuery)
        );
      });

      const filteredUsers = users.filter((user) => {
        const normalizedName = normalizeText(user.fullName || "");
        const normalizedEmail = normalizeText(user.email || "");

        return (
          normalizedName.includes(normalizedQuery) ||
          normalizedEmail.includes(normalizedQuery)
        );
      });

      const filteredOrders = orders.filter((order) => {
        const normalizedCustomerName = normalizeText(order.customerName || "");
        const orderNumberStr = order.orderNumber?.toString() || "";

        return (
          orderNumberStr.includes(query) || // Keep order number as-is for exact matching
          normalizedCustomerName.includes(normalizedQuery)
        );
      });

      setSearchResults({
        products: filteredProducts.slice(0, 5),
        users: filteredUsers.slice(0, 5),
        orders: filteredOrders.slice(0, 5),
      });
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults({ products: [], users: [], orders: [] });
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader className="py-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/">
                  <span>Admin Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarSeparator />
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Application</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    {item.title === "Search" ? (
                      <SidebarMenuButton onClick={() => setIsSearchOpen(true)}>
                        <item.icon />
                        <span>{item.title}</span>
                        <Badge variant="secondary" className="ml-auto text-xs">
                          ⌘K
                        </Badge>
                      </SidebarMenuButton>
                    ) : (
                      <SidebarMenuButton asChild>
                        <Link href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    )}
                    {item.title === "Inbox" && (
                      <SidebarMenuBadge>24</SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>Products</SidebarGroupLabel>
            <SidebarGroupAction>
              <Plus /> <span className="sr-only">Add Product</span>
            </SidebarGroupAction>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/products">
                      <Package />
                      See All Products
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Sheet>
                      <SheetTrigger asChild>
                        <SidebarMenuButton asChild>
                          <Link href="#">
                            <Plus />
                            Add Product
                          </Link>
                        </SidebarMenuButton>
                      </SheetTrigger>
                      <AddProduct />
                    </Sheet>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Categories</SidebarGroupLabel>
            <SidebarGroupAction>
              <Plus /> <span className="sr-only">Add Category</span>
            </SidebarGroupAction>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/categories">
                      <Hash />
                      See All Categories
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Sheet>
                      <SheetTrigger asChild>
                        <SidebarMenuButton asChild>
                          <Link href="#">
                            <Plus />
                            Add Category
                          </Link>
                        </SidebarMenuButton>
                      </SheetTrigger>
                      <AddCategory />
                    </Sheet>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Subcategories</SidebarGroupLabel>
            <SidebarGroupAction>
              <Plus /> <span className="sr-only">Add Subcategory</span>
            </SidebarGroupAction>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/categories">
                      <Folder />
                      See All Subcategories
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Sheet>
                      <SheetTrigger asChild>
                        <SidebarMenuButton asChild>
                          <Link href="#">
                            <Plus />
                            Add Subcategory
                          </Link>
                        </SidebarMenuButton>
                      </SheetTrigger>
                      <AddSubcategory />
                    </Sheet>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Users</SidebarGroupLabel>
            <SidebarGroupAction>
              <Plus /> <span className="sr-only">Add Admin</span>
            </SidebarGroupAction>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/users">
                      <User />
                      See All Users
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Sheet>
                      <SheetTrigger asChild>
                        <SidebarMenuButton asChild>
                          <Link href="#">
                            <Plus />
                            Add Admin
                          </Link>
                        </SidebarMenuButton>
                      </SheetTrigger>
                      <AddUser />
                    </Sheet>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Orders / Payments</SidebarGroupLabel>
            <SidebarGroupAction>
              <Plus /> <span className="sr-only">Add Order</span>
            </SidebarGroupAction>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/orders">
                      <ShoppingBasket />
                      See All Orders
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Sheet>
                      <SheetTrigger asChild>
                        <SidebarMenuButton asChild>
                          <Link href="#">
                            <Plus />
                            Add Order
                          </Link>
                        </SidebarMenuButton>
                      </SheetTrigger>
                      <AddOrder />
                    </Sheet>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton>
                    <User2 /> Admin <ChevronUp className="ml-auto" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Account</DropdownMenuItem>
                  <DropdownMenuItem>Setting</DropdownMenuItem>
                  <DropdownMenuItem>Sign out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      {/* Search Modal */}
      <Sheet open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <SheetContent side="top" className="h-[85vh] max-w-2xl mx-auto">
          <SheetHeader className="pb-4 border-b">
            <SheetTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Dashboard
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products, users, orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 h-12 text-lg"
                autoFocus
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted"
                onClick={() => setIsSearchOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {isSearching && (
              <div className="mt-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-muted-foreground">Searching...</p>
              </div>
            )}

            {!isSearching && searchQuery && (
              <div className="mt-6 space-y-6">
                {/* Products */}
                {searchResults.products.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3 text-foreground flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Products ({searchResults.products.length})
                    </h3>
                    <div className="space-y-2">
                      {searchResults.products.map((product) => (
                        <Link
                          key={product.id}
                          href={`/products`}
                          className="block p-3 rounded-lg border hover:bg-muted/50 transition-all duration-200 hover:border-primary/20"
                          onClick={() => setIsSearchOpen(false)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center">
                                <Package className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <span className="text-sm font-medium">
                                  {product.name}
                                </span>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {product.category}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Users */}
                {searchResults.users.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3 text-foreground flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Users ({searchResults.users.length})
                    </h3>
                    <div className="space-y-2">
                      {searchResults.users.map((user) => (
                        <Link
                          key={user.id}
                          href={`/users`}
                          className="block p-3 rounded-lg border hover:bg-muted/50 transition-all duration-200 hover:border-primary/20"
                          onClick={() => setIsSearchOpen(false)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center">
                                <User className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <span className="text-sm font-medium">
                                  {user.fullName}
                                </span>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {user.email}
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Orders */}
                {searchResults.orders.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3 text-foreground flex items-center gap-2">
                      <ShoppingBasket className="h-4 w-4" />
                      Orders ({searchResults.orders.length})
                    </h3>
                    <div className="space-y-2">
                      {searchResults.orders.map((order) => (
                        <Link
                          key={order.id}
                          href={`/orders`}
                          className="block p-3 rounded-lg border hover:bg-muted/50 transition-all duration-200 hover:border-primary/20"
                          onClick={() => setIsSearchOpen(false)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center">
                                <ShoppingBasket className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <span className="text-sm font-medium">
                                  Order #{order.orderNumber}
                                </span>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {order.customerName}
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {searchQuery &&
                  !isSearching &&
                  searchResults.products.length === 0 &&
                  searchResults.users.length === 0 &&
                  searchResults.orders.length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground text-lg font-medium">
                        No results found
                      </p>
                      <p className="text-muted-foreground text-sm mt-1">
                        Try searching with different keywords
                      </p>
                    </div>
                  )}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default AppSidebar;
