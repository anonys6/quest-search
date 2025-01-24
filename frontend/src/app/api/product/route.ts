import { NextResponse } from 'next/server'
import path from 'path'
import { fileURLToPath } from 'url'
import grpc from '@grpc/grpc-js'
import protoLoader from '@grpc/proto-loader'

// -----------------------------------------------------------------------------
// 1) Resolve the path to our questions.proto file
//    We assume it's in the same folder as this file: /frontend/src/app/api/product
//    If you stored it somewhere else, adjust accordingly.

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Option A: if proto is side by side:
// const PROTO_PATH = path.join(__dirname, 'questions.proto')

// Option B: if your proto is in the same folder, or "product" subfolder:
const PROTO_PATH = path.join(process.cwd(), 'src', 'app', 'api', 'product', 'questions.proto')

// -----------------------------------------------------------------------------
// 2) Load the .proto definition
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
})
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any
const questsearch = protoDescriptor.questsearch

// -----------------------------------------------------------------------------
// 3) Create a gRPC client for "QuestionsService"
//    Use environment variable GRPC_SERVER_HOST in production.
//    For local dev, you can set GRPC_SERVER_HOST=localhost:50051, or fallback:
const client = new questsearch.QuestionsService(
    process.env.GRPC_SERVER_HOST || 'localhost:50051',
    grpc.credentials.createInsecure()
)

// -----------------------------------------------------------------------------
// 4) The GET route for /api/product
//    Query params: ?search=&categories=&page=&limit=
//    We'll adapt 'categories' -> 'questionType'
// -----------------------------------------------------------------------------

export async function GET(request: Request) {
    try {
        // Parse query params from the URL
        const { searchParams } = new URL(request.url)
        const search = searchParams.get('search') || ''
        const categories = searchParams.get('categories') || ''
        const page = parseInt(searchParams.get('page') || '1', 10)
        const limit = parseInt(searchParams.get('limit') || '10', 10)

        // If you treat "categories" as "questionType", do so:
        let questionType = categories || ''

        // Prepare the gRPC request body
        const grpcRequest = {
            query: search,           // e.g. "toy"
            pageNumber: page,        // e.g. 1
            pageSize: limit,         // e.g. 10
            questionType: questionType // e.g. "ANAGRAM"
        }

        // Call the gRPC service
        const grpcResponse = await new Promise<any>((resolve, reject) => {
            client.SearchQuestions(grpcRequest, (err: Error, response: any) => {
                if (err) return reject(err)
                resolve(response)
            })
        })
        // grpcResponse => { questions, totalCount, totalPages }

        // We'll map each question to your "product" shape
        const { questions, totalCount } = grpcResponse
        const mappedProducts = questions.map((q: any, idx: number) => ({
            id: parseInt(q.id, 10) || idx + 1,
            name: q.title || 'Untitled',
            description: q.solution || 'No description', // if "solution" is in your actual data
            created_at: new Date().toISOString(),
            price: 0, // dummy price
            photo_url: 'https://via.placeholder.com/150', // placeholder image
            category: q.type || 'Unknown',
            updated_at: new Date().toISOString()
        }))

        // For pagination: offset
        const offset = (page - 1) * limit

        // Return the response shape your table expects
        const responseData = {
            success: true,
            time: new Date().toISOString(),
            message: 'Data from gRPC server',
            total_products: totalCount,
            offset,
            limit,
            products: mappedProducts
        }

        return NextResponse.json(responseData)
    } catch (error: any) {
        console.error('Error in /api/product route:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}
