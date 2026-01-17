import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

export interface UploadResult {
    url: string;
    path: string;
}

/**
 * Base64 이미지를 Firebase Storage에 업로드하고 다운로드 URL을 반환합니다.
 */
export async function uploadImage(
    base64Data: string,
    fileName: string
): Promise<UploadResult> {
    // 파일 경로 생성 (jobs/날짜/파일명)
    const date = new Date().toISOString().slice(0, 10);
    const path = `jobs/${date}/${fileName}`;
    const storageRef = ref(storage, path);

    // Base64 업로드 (data_url 형식)
    await uploadString(storageRef, base64Data, "data_url");

    // 다운로드 URL 가져오기
    const url = await getDownloadURL(storageRef);

    return { url, path };
}
