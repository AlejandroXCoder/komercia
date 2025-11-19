export interface ApiResponse<T> {
  title: string;
  status: number;
  message: string;
  data: T;
}

export interface PaginationResponse<T> {
  data: T[];           
  currentPage: number;
  totalItems: number; 
  totalPages: number;
}

export interface Pageable {
  page: number;
  size: number;
  sort?: string;
}
