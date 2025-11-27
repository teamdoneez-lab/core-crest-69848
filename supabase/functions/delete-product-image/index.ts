import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { sku, imageUrl } = await req.json();

    if (!sku || !imageUrl) {
      return new Response(
        JSON.stringify({ error: 'SKU and image URL are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Removing image:', { sku, imageUrl });

    // Step 1: Extract the storage path from the image URL
    const urlParts = imageUrl.split('/storage/v1/object/public/product-images/');
    const storagePath = urlParts.length > 1 ? urlParts[1] : null;

    // Step 2: Remove the image URL from the database array
    const { data: product, error: fetchError } = await supabase
      .from('supplier_products')
      .select('images')
      .eq('sku', sku)
      .single();

    if (fetchError) {
      console.error('Error fetching product:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Product not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Remove the image URL from the array
    const currentImages = (product.images as string[]) || [];
    const updatedImages = currentImages.filter(url => url !== imageUrl);

    // Update the database
    const { error: updateError } = await supabase
      .from('supplier_products')
      .update({ images: updatedImages })
      .eq('sku', sku);

    if (updateError) {
      console.error('Error updating product:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update product' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 3: Delete the file from storage (if path is valid)
    if (storagePath) {
      const { error: storageError } = await supabase.storage
        .from('product-images')
        .remove([storagePath]);

      if (storageError) {
        console.warn('Storage deletion error (continuing anyway):', storageError);
        // Don't fail the request if storage deletion fails - the database update succeeded
      } else {
        console.log('Successfully deleted file from storage:', storagePath);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Image removed successfully',
        updatedImages 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in delete-product-image function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
