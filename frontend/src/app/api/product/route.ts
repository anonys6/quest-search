import { NextResponse } from 'next/server'
import path from 'path'
import { fileURLToPath } from 'url'
import grpc from '@grpc/grpc-js'
import protoLoader from '@grpc/proto-loader'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PROTO_PATH = path.join(process.cwd(), 'src', 'app', 'api', 'product', 'questions.proto')

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
})
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any
const questsearch = protoDescriptor.questsearch

const client = new questsearch.QuestionsService(
    process.env.GRPC_SERVER_HOST || 'localhost:50051',
    grpc.credentials.createInsecure()
)


export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const search = searchParams.get('search') || ''
        const categories = searchParams.get('categories') || ''
        const page = parseInt(searchParams.get('page') || '1', 10)
        const limit = parseInt(searchParams.get('limit') || '10', 10)

        let questionType = categories || ''

        const grpcRequest = {
            query: search,
            pageNumber: page,
            pageSize: limit,
            questionType: questionType
        }

        const grpcResponse = await new Promise<any>((resolve, reject) => {
            client.SearchQuestions(grpcRequest, (err: Error, response: any) => {
                if (err) return reject(err)
                resolve(response)
            })
        })

        const { questions, totalCount } = grpcResponse
        const mappedProducts = questions.map((q: any, idx: number) => ({
            id: parseInt(q.id, 10) || idx + 1,
            name: q.title || 'Untitled',
            description: q.solution || 'No description',
            created_at: new Date().toISOString(),
            price: 0,
            photo_url: 'https://via.placeholder.com/150',
            category: q.type || 'Unknown',
            updated_at: new Date().toISOString()
        }))

        const offset = (page - 1) * limit

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
