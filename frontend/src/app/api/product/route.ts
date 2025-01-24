// /frontend/src/app/api/product/route.ts
import { NextResponse } from 'next/server'
import path from 'path'
import grpc from '@grpc/grpc-js'
import protoLoader from '@grpc/proto-loader'

/** 
 * 1) Load the .proto definition 
 */
const PROTO_PATH = "/home/clay/Project/quest-search/backend/proto/questions.proto"
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
})
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any
const questsearch = protoDescriptor.questsearch

/**
 * 2) Create a client to connect to your gRPC server.
 *    Make sure 'localhost:50051' is correct if your server
 *    is running locally on that port.
 */
const client = new questsearch.QuestionsService(
    'localhost:50051',
    grpc.credentials.createInsecure()
)

/**
 * 3) Your route handler:
 *    GET /api/product?search=&categories=&page=&limit=
 *    We'll adapt your question data to a "product" shape for the existing table.
 */
export async function GET(request: Request) {
    try {
        // Parse query params
        const { searchParams } = new URL(request.url)
        const search = searchParams.get('search') || ''
        const categories = searchParams.get('categories') || ''
        const page = parseInt(searchParams.get('page') || '1', 10)
        const limit = parseInt(searchParams.get('limit') || '10', 10)

        // If you want to treat "categories" as a single questionType, do so:
        let questionType = ''
        // If there's exactly one category in 'categories', let's use it
        // If you prefer multiple categories logic, you'd need changes in your gRPC
        if (categories) {
            questionType = categories
        }

        // Prepare gRPC request
        const grpcRequest = {
            query: search,
            pageNumber: page,
            pageSize: limit,
            questionType: questionType
        }

        // Call gRPC (SearchQuestions)
        const grpcResponse = await new Promise<any>((resolve, reject) => {
            client.SearchQuestions(grpcRequest, (err: Error, response: any) => {
                if (err) return reject(err)
                resolve(response)
            })
        })

        // grpcResponse => { questions, totalCount, totalPages }

        // We'll map your question data to the shape your table expects.
        // The table columns want:
        //   {
        //     id: number,
        //     name: string,
        //     description: string,
        //     created_at: string,
        //     price: number,
        //     photo_url: string,
        //     category: string,
        //     updated_at: string
        //   }
        // We'll produce these from question data:
        //   question.id => parse as number? or keep random
        //   question.title => name
        //   question.type => category
        //   solution => description? if you want
        // We'll fill dummy for "photo_url" or "price."

        const { questions, totalCount } = grpcResponse
        const mappedProducts = questions.map((q: any, index: number) => {
            // q => { id, type, title, solution? blocks? etc. }
            return {
                id: parseInt(q.id, 10) || index + 1, // if q.id is a numeric string
                name: q.title || 'Untitled',
                description: q.solution || 'No description',
                created_at: new Date().toISOString(),
                price: 0,
                photo_url: 'https://via.placeholder.com/150',
                category: q.type || 'Unknown',
                updated_at: new Date().toISOString()
            }
        })

        // Compute offset for consistent pagination info
        const offset = (page - 1) * limit

        // Return in the same shape your existing code expects:
        const response = {
            success: true,
            time: new Date().toISOString(),
            message: 'Data from gRPC server',
            total_products: totalCount,
            offset,
            limit,
            products: mappedProducts
        }

        return NextResponse.json(response)
    } catch (err: any) {
        console.error('Error in /api/product route:', err)
        return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    }
}
