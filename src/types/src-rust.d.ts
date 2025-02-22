declare module "src-rust" {
    export function upload_file(api_key: string, file_data: Uint8Array, filename: string): Promise<string>;
    export function create_assistant(api_key: string, name: string, instructions: string, model: string, file_ids: string): Promise<string>;
    export function create_thread(api_key: string): Promise<string>;
    export function create_message(api_key: string, thread_id: string, content: string, file_ids: string): Promise<string>;
    export function run_assistant(api_key: string, thread_id: string, assistant_id: string, instructions: string | null): Promise<string>;
    export function get_run(api_key: string, thread_id: string, run_id: string): Promise<string>;
    export function list_messages(api_key: string, thread_id: string): Promise<string>;
    export function analyze_file(api_key: string, file_id: string): Promise<string>;
    export function analyze_image(api_key: string, image_data: string, is_url: boolean): Promise<string>;
}
