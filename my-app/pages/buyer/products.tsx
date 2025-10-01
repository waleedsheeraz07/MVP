// pages/buyer/products.tsx
import Head from 'next/head'
import { prisma } from "../../lib/prisma";
import { GetServerSidePropsContext } from "next";
import { useState, useMemo, ChangeEvent, useEffect } from "react";
import Layout from "../../components/header";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]";
import { useRouter } from "next/router";
import { useRef } from "react"; // add at the top
import Link from 'next/link'
import Image from 'next/image'

interface Product {
  id: string;
  title: string;
  description?: string;
  price: number;
  images: string[];
  colors: string[];
  sizes: string[];
  condition: string;
  era: string;
  quantity: number;
  ownerId: string;
  categories: { id: string; title: string }[];
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  title: string;
  order: number;
  parentId?: string | null;
}

interface User {
  id: string;
  name?: string | null;
  role: string;
}

interface ProductsPageProps {
  products: Product[];
  categories: Category[];
  user: User;
}

type SortOption = "alpha" | "alphaDesc" | "priceAsc" | "priceDesc" | "relevance";

interface CategoryNode extends Category {
  children?: CategoryNode[];
}

export default function ProductsPage({ products, categories, user }: ProductsPageProps) {
 // inside ProductsPage component
const initialQuerySynced = useRef(false);

 const router = useRouter();
  const [loadingProduct, setLoadingProduct] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [selectedEras, setSelectedEras] = useState<string[]>([]);

  const allColors = Array.from(new Set(products.flatMap(p => p.colors)));
  const allSizes = Array.from(new Set(products.flatMap(p => p.sizes)));

  const categoryTree: CategoryNode[] = useMemo(() => {
    const map: Map<string, CategoryNode> = new Map(
      categories.map(c => [c.id, { ...c, children: [] }])
    );
    const roots: CategoryNode[] = [];
    map.forEach(cat => {
      if (cat.parentId && map.has(cat.parentId)) {
        map.get(cat.parentId)!.children!.push(cat);
      } else {
        roots.push(cat);
      }
    });
    return roots;
  }, [categories]);
 
// --- sync state from router query only once ---
useEffect(() => {
  if (!router.isReady || initialQuerySynced.current) return;

  // Search
  setSearch((router.query.search as string) || "");

  // Colors
  setSelectedColors(
    router.query.colors
      ? (router.query.colors as string).split(",").map(c => c.trim().toUpperCase())
      : []
  );

  // Sizes
  setSelectedSizes(
    router.query.sizes
      ? (router.query.sizes as string).split(",").map(s => s.trim().toUpperCase())
      : []
  );

  // Categories
  setSelectedCategories(
    router.query.categories
      ? (router.query.categories as string).split(",")
      : []
  );

  // Sort
  setSortBy((router.query.sortBy as SortOption) || "relevance");

  // Conditions
  setSelectedConditions(
    router.query.conditions
      ? (router.query.conditions as string).split(",").map(c => c.trim().toLowerCase())
      : []
  );

setSelectedEras(
  router.query.eras
    ? (router.query.eras as string).split(",")
    : []
);

  // Price
  const prices = products.map(p => p.price);
  const min = router.query.priceMin ? Number(router.query.priceMin) : Math.min(...prices);
  const max = router.query.priceMax ? Number(router.query.priceMax) : Math.max(...prices);
  setPriceRange([min, max]);

  initialQuerySynced.current = true;
}, [router.query, router.isReady, products]);

useEffect(() => {
  if (!router.isReady || !initialQuerySynced.current) return;

  const query: Record<string, string> = {};

  if (search) query.search = search;
  if (selectedColors.length) query.colors = selectedColors.join(",");
  if (selectedSizes.length) query.sizes = selectedSizes.join(",");
  if (selectedCategories.length) query.categories = selectedCategories.join(",");
  if (sortBy !== "relevance") query.sortBy = sortBy;
  if (selectedConditions.length) query.conditions = selectedConditions.join(",");
  if (selectedEras.length) query.eras = selectedEras.join(",");

  const prices = products.map(p => p.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  if (priceRange[0] !== minPrice) query.priceMin = String(priceRange[0]);
  if (priceRange[1] !== maxPrice) query.priceMax = String(priceRange[1]);

  // Compare with current router.query
  const currentQuery: Record<string, string> = {};
  Object.entries(router.query).forEach(([key, val]) => {
    if (typeof val === "string") currentQuery[key] = val;
  });

  const isEqual =
    Object.keys(query).length === Object.keys(currentQuery).length &&
    Object.keys(query).every(key => query[key] === currentQuery[key]);

  if (!isEqual) {
    router.replace({ pathname: router.pathname, query }, undefined, { shallow: true });
  }
}, [
  search,
  selectedColors,
  selectedSizes,
  selectedCategories,
  selectedConditions,
  selectedEras, // ✅ included
  sortBy,
  priceRange,
  products,
  router
]);

  const handlePriceChange = (e: ChangeEvent<HTMLInputElement>, index: 0 | 1) => {
    const val = Number(e.target.value);
    setPriceRange(prev => (index === 0 ? [val, prev[1]] : [prev[0], val]));
  };

  const CategoryCheckbox: React.FC<{
    category: CategoryNode;
    selected: string[];
    setSelected: (ids: string[]) => void;
  }> = ({ category, selected, setSelected }) => {
    const [expanded, setExpanded] = useState(true);
    const isChecked = selected.includes(category.id);

    const allDescendantIds = useMemo(() => {
      const ids: string[] = [];
      const traverse = (node: CategoryNode) => {
        ids.push(node.id);
        node.children?.forEach(traverse);
      };
      traverse(category);
      return ids;
    }, [category]);

    const toggle = () => {
      if (isChecked) setSelected(selected.filter(id => !allDescendantIds.includes(id)));
      else setSelected([...new Set([...selected, ...allDescendantIds])]);
    };

    return (
      <div className="ml-2">
        <label className="flex items-center gap-1">
          {category.children?.length ? (
            <button type="button" className="mr-1 text-sm font-bold" onClick={() => setExpanded(p => !p)}>
              {expanded ? "▼" : "►"}
            </button>
          ) : null}
          <input type="checkbox" checked={isChecked} onChange={toggle} />
          {category.title}
        </label>
        {expanded && category.children?.length ? (
          <div className="ml-4 border-l border-gray-200 pl-2">
            {category.children.map(child => (
              <CategoryCheckbox key={child.id} category={child} selected={selected} setSelected={setSelected} />
            ))}
          </div>
        ) : null}
      </div>
    );
  };

const filteredProducts = useMemo(() => {
  let result = products
    // Price filter
    .filter(p => p.price >= priceRange[0] && p.price <= priceRange[1])

    // Colors filter
    .filter(p => {
      if (selectedColors.length === 0) return true; // "All" selected

      // Normalize product colors
      const productColors = p.colors
        .map(c => c.trim().toUpperCase())
        .filter(Boolean); // remove empty strings

      // Normalize selected colors
      const selectedColorsNormalized = selectedColors.map(c => c.trim().toUpperCase());

      // Check if at least one color matches
      return productColors.some(c => selectedColorsNormalized.includes(c));
    })

    // Sizes filter
    .filter(p => {
      if (selectedSizes.length === 0) return true; // "All" selected

      const productSizes = p.sizes
        .map(s => s.trim().toUpperCase())
        .filter(Boolean);

      const selectedSizesNormalized = selectedSizes.map(s => s.trim().toUpperCase());

      return productSizes.some(s => selectedSizesNormalized.includes(s));
    })


// Condition filter (multi-select)
.filter(p => {
  if (selectedConditions.length === 0) return true; // no filter
  return selectedConditions.includes(p.condition.toLowerCase().trim());
})

// Era filter
.filter(p => {
  if (selectedEras.length === 0) return true; // no filter

  return selectedEras.some(era => {
    if (era === "before1900") {
      // ✅ Point 2: handle range/any single year before 1900
      const productYear = Number(p.era.split("–")[0]); // get starting year
      return productYear < 1900;
    } else {
      return p.era === era; // match exact decade string
    }
  });
})

    // Categories filter
    .filter(p =>
      selectedCategories.length === 0 ||
      p.categories.some(cat => selectedCategories.includes(cat.id))
    );

  // Search filter
  if (search.trim()) {
    const searchLower = search.toLowerCase();
    result = result.filter(p => p.title.toLowerCase().includes(searchLower));
  }

  // Sorting
  switch (sortBy) {
    case "alpha": result.sort((a, b) => a.title.localeCompare(b.title)); break;
    case "alphaDesc": result.sort((a, b) => b.title.localeCompare(a.title)); break;
    case "priceAsc": result.sort((a, b) => a.price - b.price); break;
    case "priceDesc": result.sort((a, b) => b.price - a.price); break;
    case "relevance":
      const searchLower = search.toLowerCase();
      result.sort((a, b) => {
        const score = (title: string) =>
          title === searchLower ? 3 :
          title.startsWith(searchLower) ? 2 :
          title.includes(searchLower) ? 1 : 0;
        return score(b.title.toLowerCase()) - score(a.title.toLowerCase());
      });
      break;
  }

  return result;
}, [products, search, selectedColors, selectedSizes, selectedCategories, selectedConditions, selectedEras, sortBy, priceRange]);

const eras = [
    "before1900",
    "1900–1909",
    "1910–1919",
    "1920–1929",
    "1930–1939",
    "1940–1949",
    "1950–1959",
    "1960–1969",
    "1970–1979",
    "1980–1989",
    "1990–1999",
    "2000–2009",
    "2010–2019",
    "2020–2025",
];


}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { categories: { include: { category: { select: { id: true, title: true } } } } },
  });

  const categories = await prisma.category.findMany({
    select: { id: true, title: true, order: true, parentId: true },
    orderBy: { order: "asc" },
  });

  return {
    props: {
      products: products.map(p => ({
        ...p,
        categories: p.categories.map(pc => pc.category),
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
      categories,
      user: {
        id: session?.user?.id ?? "Guest",
        name: session?.user?.name ?? "Guest",
        role: session?.user?.role ?? "Guest",
},
    },
  };
}