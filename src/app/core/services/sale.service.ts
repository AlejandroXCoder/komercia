import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, PaginationResponse, Pageable } from '../models/api-response.model';
import { Sale, SaleDTO } from '../models/sale.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SaleService {
  private apiUrl = `${environment.apiUrl}/api/sales`;

  constructor(private http: HttpClient) {}

  getAllSales(pageable: Pageable): Observable<ApiResponse<PaginationResponse<Sale>>> {
    let params = new HttpParams()
      .set('page', pageable.page.toString())
      .set('size', pageable.size.toString());

    if (pageable.sort) {
      params = params.set('sort', pageable.sort);
    }

    return this.http.get<ApiResponse<PaginationResponse<Sale>>>(this.apiUrl, { params });
  }

  getSaleById(id: number): Observable<ApiResponse<Sale>> {
    return this.http.get<ApiResponse<Sale>>(`${this.apiUrl}/${id}`);
  }

  createSale(sale: SaleDTO): Observable<ApiResponse<Sale>> {
    return this.http.post<ApiResponse<Sale>>(this.apiUrl, sale);
  }

  updateSale(id: number, sale: SaleDTO): Observable<ApiResponse<Sale>> {
    return this.http.put<ApiResponse<Sale>>(`${this.apiUrl}/${id}`, sale);
  }

  deleteSale(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  toggleSaleStatus(id: number, status: boolean): Observable<ApiResponse<Sale>> {
    return this.http.put<ApiResponse<Sale>>(`${this.apiUrl}/${id}`, { status });
  }
}
