export type ApiOptions = {
  /**
   * Api username
   */
  api_username?: string,
  /**
   * Api key
   */
  api_key?: string,
  /**
   * User Api Key
   */
  user_api_key?: string,
  /**
   * User Api Client Id
   */
  user_api_client_id?: string,
  
}

/**
 * The uploads from server
 * 
 * *Example:*
 * 
 * ```json
 * {
 *     "id": 2973,
 *     "url": "https://discourse.example/uploads/default/original/2X/4/436ccd13b6e46397a792d51fbef445380b1cc1d3.jpeg",
 *     "original_filename": "photo_2023-05-28_17-35-00.jpg",
 *     "filesize": 122190,
 *     "width": 640,
 *     "height": 640,
 *     "thumbnail_width": 500,
 *     "thumbnail_height": 500,
 *     "extension": "jpeg",
 *     "short_url": "upload://9Ct5W75p3SHRlq6I3TfD1OaFEdR.jpeg",
 *     "short_path": "/uploads/short-url/9Ct5W75p3SHRlq6I3TfD1OaFEdR.jpeg",
 *     "retain_hours": null,
 *     "human_filesize": "119 KB",
 *     "dominant_color": "67545B"
 * }
 * ```
 */
export type Uploads = {
  /**
   * Uploads unique id
   */
  id: number,
  url: string,
  original_filename: string,
  filesize: number,
  width?: number,
  height?: number,
  thumbnail_width?: number,
  thumbnail_height?: number,
  /**
   * file extension
   */
  extension: string,
  short_url: string,
  short_path: string,
  human_filesize: string,
  dominant_color?: string,
  retain_hours?: number | null,
} & {
  [key in string]: unknown;
}