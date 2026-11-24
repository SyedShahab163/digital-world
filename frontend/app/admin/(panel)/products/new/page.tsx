import { PageHeader } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";

export const metadata = { title: "Add laptop" };

export default function NewProductPage() {
  return (<><PageHeader title="Add laptop" description="Fill in the details. You can change anything later." /><ProductForm /></>);
}
