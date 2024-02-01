import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';



@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.css']
})
export class InicioComponent implements OnInit {
  noticias: any[] = [];
  favoritas: any[] = [];
  noticiasFavoritas: any[] = [];
  dataSource: MatTableDataSource<any>;
  columnas: string[] = ['imagen', 'titulo', 'descripcion', 'fecha', 'favoritos'];
  favoritosDataSource: MatTableDataSource<any> = new MatTableDataSource<any>([]);
  columnasFavoritos: string[] = ['favorito_titulo', 'favorito_descripcion', 'favorito_fecha', 'acciones'];

  selectedIndex = 0;

  changeTab(index: number): void {
    this.selectedIndex = index;
  }

  resetTab(): void {
    this.selectedIndex = 0;
  }

  addToFavorites(item: any) {
    this.favoritas.push(item);
  }

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild('recentPaginator', { static: true }) recentPaginator!: MatPaginator;
  @ViewChild('favoritesPaginator', { static: true }) favoritesPaginator!: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort = new MatSort();

  constructor(private http: HttpClient, private _snackBar: MatSnackBar) {
    this.dataSource = new MatTableDataSource(this.noticias);
  }

  ngOnInit() {
    this.obtenerTodasLasNoticias();
  }

  agregarFavoritos(noticia: any) {
  if (!this.favoritas.includes(noticia)) {
    this.favoritas.push(noticia);

    const nuevoFavorito = {
      id: noticia.id,
      titulo: noticia.title,
      descripcion: noticia.summary,
      fecha: new Date()
    };

    this.http.post('http://localhost:8081/apiDesafio/guardaNoticia', nuevoFavorito)
      .subscribe(
        (response: any) => {
          console.log('Favorito agregado:', response);
          this.mostrarMensaje('Agregado a Favoritos', 'La noticia se ha agregado a tus Favoritos.');
          
        },
        (error) => {
          console.error('Error al agregar favorito:', error);
          if (error.status === 404) {
            console.error('El servidor no pudo encontrar la ruta.');
          } else if (error.status === 500) {
            console.error('Error interno del servidor. Por favor, inténtelo más tarde.');
          } else {
            console.error('Error desconocido:', error);
          }
        }
      );
  }
}


  eliminarFavoritos(noticia: any) {
    const index = this.favoritas.indexOf(noticia);
    if (index >= 0) {
      this.eliminarFavorito(noticia);
    }
  }
  

  eliminarFavorito(noticia: any) {
    const index = this.favoritas.findIndex(favorito => favorito.id === noticia.id);
    const url = `http://localhost:8081/apiDesafio/eliminarNoticia/${noticia.id}`;
    console.log('URL de la solicitud DELETE:', url);
    this.favoritas.splice(index, 1);
    console.log('ID de la noticia a eliminar:', noticia.id);

    this.http.delete(`http://localhost:8081/apiDesafio/eliminarNoticia/${noticia.id}`)
      .subscribe(
        (response: any) => {
          console.log('Favorito eliminado:', response);
          this.mostrarMensaje('Eliminado de Favoritos', 'La noticia se ha eliminado de tus Favoritos.');
          this.cargarNoticiasFavoritas();
        },
        (error) => {
          console.error('Error al eliminar favorito:', error);
          if (error.status === 404) {
            console.error('El servidor no pudo encontrar la ruta.');
          } else if (error.status === 500) {
            console.error('Error interno del servidor. Por favor, inténtelo más tarde.');
          } else {
            console.error('Error desconocido:', error);
          }
        }
      );
  }
  

  mostrarMensaje(titulo: string, mensaje: string) {
    this._snackBar.open(mensaje, titulo, {
      duration: 3000,
    });
  }
  
  
  cargarNoticiasFavoritas() {
    this.http.get('http://localhost:8081/apiDesafio/noticias').subscribe(
      (response: any) => {
        this.noticiasFavoritas = response.noticiasResponse.noticias;
  
        this.noticiasFavoritas.forEach((noticia: any) => {
          noticia.fecha = this.formatDate(noticia.fecha);
        });
  
        this.favoritosDataSource = new MatTableDataSource(this.noticiasFavoritas);
        this.favoritosDataSource.paginator = this.favoritesPaginator; 
        this.favoritosDataSource.sort = this.sort; 
      },
      (error) => {
        console.error('Error al cargar noticias favoritas:', error);
      }
    );
  }
  
  cambiarPestana(event: any) {
    if (event.tab.textLabel === 'Favoritos') {
      this.cargarNoticiasFavoritas();
      this.favoritosDataSource.paginator = this.favoritesPaginator; 
    } else {
      this.dataSource.paginator = this.recentPaginator; 
    }
  }
  

  formatDate(date: string): string {
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    };
    return new Date(date).toLocaleDateString(undefined, options);
  }
  

  aplicarFiltro(event: Event | null): void {
    if (event && event.target instanceof HTMLInputElement) {
      const valor = event.target.value;
      this.dataSource.filter = valor.trim().toLowerCase();
    }
  }

  aplicarFiltroFavoritos(event: Event | null): void {
    if (event && event.target instanceof HTMLInputElement) {
      const valor = event.target.value;
      this.favoritosDataSource.filter = valor.trim().toLowerCase();
    }
  }
  
  obtenerTodasLasNoticias() {
    const baseUrl = 'https://api.spaceflightnewsapi.net/v4/articles';
    this.recursivamenteObtenerNoticias(baseUrl);
  }

  recursivamenteObtenerNoticias(url: string) {
    this.http.get<any>(url).subscribe(
      (data: any) => {
        if (data && Array.isArray(data.results)) {
          this.noticias = this.noticias.concat(data.results);
          this.dataSource.data = this.noticias;
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;

          if (data.next) {
            this.recursivamenteObtenerNoticias(data.next);
          }
        } else {
          console.error('API response does not contain an array of results:', data);
        }
      },
      (error) => {
        console.error('Error fetching data from the API:', error);
      }
    );
  }

}
