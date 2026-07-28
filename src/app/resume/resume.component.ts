import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  signal,
} from '@angular/core';
import {
  GlobalWorkerOptions,
  getDocument,
  type PDFDocumentLoadingTask,
  type PDFDocumentProxy,
  type PDFPageProxy,
  type RenderTask,
} from 'pdfjs-dist';

if (!GlobalWorkerOptions.workerPort) {
  GlobalWorkerOptions.workerPort = new Worker('/pdf.worker.min.mjs', { type: 'module' });
}

@Component({
  selector: 'app-resume',
  templateUrl: './resume.component.html',
  styleUrl: './resume.component.scss',
})
export class ResumeComponent implements AfterViewInit, OnDestroy {
  @ViewChild('resumeCanvas', { static: true })
  private readonly resumeCanvas!: ElementRef<HTMLCanvasElement>;

  @ViewChild('resumeDocument', { static: true })
  private readonly resumeDocument!: ElementRef<HTMLElement>;

  protected readonly resumeUrl = '/Resume.pdf';
  protected readonly resumePreviewUrl = '/Resume-preview.png';
  protected readonly renderState = signal<'loading' | 'ready' | 'error'>('loading');
  protected readonly renderError = signal<string | null>(null);

  private loadingTask?: PDFDocumentLoadingTask;
  private pdfDocument?: PDFDocumentProxy;
  private pdfPage?: PDFPageProxy;
  private renderTask?: RenderTask;
  private resizeObserver?: ResizeObserver;
  private lastRenderWidth = 0;

  async ngAfterViewInit(): Promise<void> {
    this.resizeObserver = new ResizeObserver(([entry]) => {
      const width = Math.floor(entry.contentRect.width);

      if (Math.abs(width - this.lastRenderWidth) > 1) {
        void this.renderPage(width);
      }
    });
    this.resizeObserver.observe(this.resumeDocument.nativeElement);

    try {
      this.loadingTask = getDocument({ url: this.resumeUrl });
      this.pdfDocument = await this.loadingTask.promise;
      this.pdfPage = await this.pdfDocument.getPage(1);
      await this.renderPage(this.resumeDocument.nativeElement.clientWidth);
    } catch (error) {
      this.renderError.set(error instanceof Error ? error.message : 'Unable to load the PDF.');
      this.renderState.set('error');
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.renderTask?.cancel();
    void this.loadingTask?.destroy();
  }

  private async renderPage(containerWidth: number): Promise<void> {
    if (!this.pdfPage || containerWidth <= 0) {
      return;
    }

    this.renderTask?.cancel();

    const canvas = this.resumeCanvas.nativeElement;
    const baseViewport = this.pdfPage.getViewport({ scale: 1 });
    const cssScale = containerWidth / baseViewport.width;
    const outputScale = Math.min(window.devicePixelRatio || 1, 2);
    const viewport = this.pdfPage.getViewport({ scale: cssScale * outputScale });

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    canvas.style.width = `${Math.floor(viewport.width / outputScale)}px`;
    canvas.style.height = `${Math.floor(viewport.height / outputScale)}px`;

    const currentRenderTask = this.pdfPage.render({ canvas, viewport });
    this.renderTask = currentRenderTask;

    try {
      await currentRenderTask.promise;

      if (this.renderTask === currentRenderTask) {
        this.lastRenderWidth = containerWidth;
        this.renderState.set('ready');
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'RenderingCancelledException') {
        this.renderError.set(error.message);
        this.renderState.set('error');
      }
    }
  }
}
