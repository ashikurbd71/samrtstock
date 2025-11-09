import { dbConnect } from '@/app/lib/dbConnect';
import { Product } from '@/app/lib/models';
import { generateProductsExcel } from '@/app/lib/excelGenerator';

export const runtime = 'nodejs';

export async function GET() {
  await dbConnect();
  const products = await Product.find({}).sort({ createdAt: -1 });
  const { buffer, filename } = await generateProductsExcel(products);

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}