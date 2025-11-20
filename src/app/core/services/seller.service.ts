import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, PaginationResponse, Pageable } from '../models/api-response.model';
import { Seller, SellerDTO } from '../models/seller.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SellerService {
  private apiUrl = `${environment.apiUrl}/api/sellers`;

  constructor(private http: HttpClient) {}

  getAllSellers(pageable: Pageable): Observable<ApiResponse<PaginationResponse<Seller>>> {
    let params = new HttpParams()
      .set('page', pageable.page.toString())
      .set('size', pageable.size.toString());

    if (pageable.sort) {
      params = params.set('sort', pageable.sort);
    }

    return this.http.get<ApiResponse<PaginationResponse<Seller>>>(this.apiUrl, { params });
  }

  getSellerById(id: number): Observable<ApiResponse<Seller>> {
    return this.http.get<ApiResponse<Seller>>(`${this.apiUrl}/${id}`);
  }

  createSeller(seller: SellerDTO): Observable<ApiResponse<Seller>> {
    return this.http.post<ApiResponse<Seller>>(this.apiUrl, seller);
  }

  updateSeller(id: number, seller: SellerDTO): Observable<ApiResponse<Seller>> {
    return this.http.put<ApiResponse<Seller>>(`${this.apiUrl}/${id}`, seller);
  }

  deleteSeller(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  toggleSellerStatus(id: number, status: boolean): Observable<ApiResponse<Seller>> {
    return this.http.put<ApiResponse<Seller>>(`${this.apiUrl}/${id}`, { status });
  }
}
