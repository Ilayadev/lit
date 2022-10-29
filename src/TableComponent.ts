import { html, css, LitElement, PropertyValueMap, PropertyDeclarations, nothing } from 'lit';
import { tableData } from '.';
import { property, query, state } from 'lit/decorators.js';
import { map } from 'lit/directives/map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { classMap } from 'lit/directives/class-map.js';

export class TableComponent extends LitElement {
  constructor() {
    super()
  }
  connectedCallback(): void {
    super.connectedCallback()
  }
  @property({ type: Object })
  data!: { columns: { name: string, editable: boolean }[], rows: any[] }

  @state()
  extraElement!: number
  startingPoint!: number
  rowPerBlock!: number
  firstcall: boolean = true
  @property({ type: Number })
  rowHeight!: number
  @state()
  scrollTop!: number
  currentItems!: any[]
  @state()
  selectedRow: number = 1;
  @state()
  selectedColumn: number = 1
  @state()
  overlapDetails: Partial<{ left: string, top: string, width: string, height: string }>={left:"0px",top:"0px",width:"0px",height:"0px"}
  @state()
  editorMode: boolean = false
  editorRect!: Partial<{ left: string, top: string, width: string, height: string }>
  @state()
  selectedRowColumn: boolean = false
  @query('div[selected]')
  selectedElement!: HTMLElement
  @query('.table-container')
  tableElement!: HTMLElement
  @query('div[contenteditable]')
  editor!: HTMLElement

  protected firstUpdated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    this.tableElement.focus()
    this.initializing()        

  }
  get tableHeight() {
    return this.tableElement?.getBoundingClientRect().height
  }
  get parentDeatils() {
    let clientrect = this.getBoundingClientRect()
    let bottom = clientrect.bottom
    let top = clientrect.top
    return {
      top: top,
      bottom: bottom
    }
  }
  static styles = css`   
     :host{
      font-family:Roboto, "Helvetica Neue", sans-serif;
      font-size:12px
     }
    .table-container{
      width:100%;
      height:100%;      
      box-sizing:border-box;
      display:grid;
      grid-template-columns:auto 1fr;
      grid-template-rows:100%;
      overflow-y:auto;
      outline:none;
    }    
    .serial-panel{
      border-left:1px solid #dedede;
      position:sticky;
      left:0;
      z-index:20;
      background-color:#fff
    }
    .content-panel{
      z-index:10;
    }
    .panel{      
     display:grid;
     grid-template-columns:auto;
     grid-template-rows:30px 1fr;    
     height:max-content; 
    }
    .content-header,.serial-header{
      display:grid;     
      position:sticky;
      top:0;
      left:0 ;
      z-index:30
    }
    .common{
      padding:7px 4px 4px 7px ;         
      border-right:1px solid #dedede;
      border-bottom:1px solid #dedede;  
      border-left:1px solid transparent;
      border-top:1px solid transparent;    
    }
    .header{
      background-color:#ededed;
      border-top:1px solid #dedede;
      font-weight:bold;
    }    
    .translating-element{
      display:grid;
      grid-auto-rows:30px;
      outline:none;
    }   
    .cells{
      min-width:50px;
    }
    .hightlightRowColumn{ 
      background-color:rgb(19, 173, 107);
      border:1px solid rgb(19, 173, 107) 
    }
    .highlightCell{
      border:1px solid rgb(19, 173, 107);
    }
    .overlap{
      position:absolute;
      background-color:#accef7;
      border:1pz solid #09e987;
      opacity:.4;
      pointer-events:none
    }
    .editor{
      position: absolute;
      border: 1px solid #13ad6b;
      background-color: #fff;
      z-index: 20;
      outline: none;
      padding: 2px 4px;
      box-sizing:border-box;
    }
    .editor::after{
      content: attr(selected);
    left: -1px;
    position: absolute;
    bottom: 100%;
    background-color: #17a366;
    color: white;
    padding: 2px 5px;
}
    
  `;
  generateColumns(columnArray: any[]) {
    return html`${map(columnArray, (item, index) => {
      return html`<div class="header common cells ${classMap({ hightlightRowColumn: this.selectedColumn == index + 1 && this.selectedRow == 0 })}" @click="${(event: any) => { this.highlightColumn(index + 1, event.target) }}">${item.name}</div>`
    })}`
  }
  generateSerials(serials: any[]) {
    return html`${map(serials, (item, index) => {
      index = index + this.startingPoint + 1
      let condition:boolean = this.selectedRow == index && this.selectedColumn == 0
      return html`<div class="common ${classMap({ hightlightRowColumn: condition })}" ?selected=${condition} @click="${(event: any) => { this.hightlightRow(index, event.target) }}">${index}</div>`
    })}`
  }
  generateRowCells(rows: any[]) {
    return html`${map(rows, (rowItem, index) => {
      return html`${map(this.data.columns, (columnItem, columnIndex) => {
        let selectingCondition: boolean = this.selectedRow === index + this.startingPoint + 1 && this.selectedColumn === columnIndex + 1
        return html`<div class="common cells ${classMap({ highlightCell: selectingCondition })}" ?selected=${selectingCondition} @click="${() => { this.highlightCell(index + this.startingPoint + 1, columnIndex + 1) }}" >${rowItem[columnItem.name]}</div>`
      })}`
    })}`
  }
  initializing() {
    this.rowPerBlock = Math.ceil(this.tableHeight / this.rowHeight)
    this.extraElement = Math.floor(this.rowPerBlock / 2)
    this.getCurrentItems(0)
  }
  getCurrentItems(scrolltop: number) {
    this.startingPoint = Math.floor((scrolltop / this.rowHeight) - this.extraElement)
    this.startingPoint = Math.max(0, this.startingPoint)
    let visibleCount = this.rowPerBlock + this.extraElement + 1
    visibleCount = Math.min(this.data.rows.length - visibleCount, visibleCount)
    this.currentItems = this.data.rows.slice(this.startingPoint, this.startingPoint + visibleCount)
    this.scrollTop = this.startingPoint * this.rowHeight

  }
  hightlightRow(rowNumber: number, element: HTMLElement) {
    this.selectedColumn = 0
    this.selectedRowColumn = true
    this.selectedRow = rowNumber
    this.updatePropertyValue(element, "row")

  }
  highlightColumn(columnIndex: number, element: HTMLElement) {
    this.selectedRowColumn = true
    this.selectedRow = 0
    this.selectedColumn = columnIndex
    this.updatePropertyValue(element, "column")
  }
  highlightCell(rowIndex: number, columnIndex: number) {
    this.selectedRowColumn = false
    this.selectedRow = rowIndex
    this.selectedColumn = columnIndex
    setTimeout(() => {
      this.elementInViewport()
    }, 0.1);
  }
  elementInViewport() {
    let top = this.selectedElement?.getBoundingClientRect().top
    let bottom = this.selectedElement?.getBoundingClientRect().bottom
    let containerTop = this.parentDeatils.top + 30
    let containerBottom = this.parentDeatils.bottom
    if (top < containerTop) {
      let scrolltop = containerTop - top
      this.tableElement.scrollBy(0, -scrolltop)
    }
    else if (bottom > containerBottom) {
      let scrolltop = bottom - containerBottom
      this.tableElement.scrollBy(0, scrolltop)
    }

  }
  bluringEditor = () => {
    this.editorMode = false
    this.tableElement.focus()
  }
  keyOperting(e: any) {
    let code: number = e.keyCode
    if (code >= 37 && code <= 40) {
      if (!this.editorMode) {
        e.preventDefault()
        if (code === 37) {
          if (this.selectedColumn !== 1) {
            this.selectedColumn--
          }
        } else if (code === 39) {
          if (this.selectedColumn !== this.data.columns.length) {
            this.selectedColumn++
          }
        } else if (code === 38) {
          if (this.selectedRow !== 1) {
            this.selectedRow--
            setTimeout(() => {
              this.elementInViewport()
            }, 0.1);
          }
        } else {
          if (this.selectedRow !== this.data.rows.length) {
            this.selectedRow++
            setTimeout(() => {
              this.elementInViewport()
            }, 0.1);
          }
        }
      }
    } else if (code === 13) {
      e.preventDefault()
      if (this.editorMode) {
        this.editorMode = false
        this.bluringEditor()
      } else {
        if (this.selectedElement) {
          this.editorMode = true
          this.getEditorClientRect(this.selectedElement)
          setTimeout(() => {
            this.editor.focus({ preventScroll: true })
          }, 1);
        }
      }
    }
  }
  getEditorClientRect(element: HTMLElement) {
    this.editorRect = {}
    let height = element.getBoundingClientRect().height + "px"
    let width = element.getBoundingClientRect().width + "px"
    let left = element.getBoundingClientRect().left + "px"
    let top = element.getBoundingClientRect().top + "px"
    this.editorRect.left = left
    this.editorRect.width = width
    this.editorRect.top = top
    this.editorRect.height = height

  }
  updatePropertyValue(element: HTMLElement, selected: "row" | "column") {
    this.overlapDetails = {}
    this.overlapDetails["left"] = element?.offsetLeft + "px"
    this.overlapDetails["top"] = element?.offsetTop + "px"
    if (selected === "row") {
      this.overlapDetails["width"] = "100%"
      this.overlapDetails["height"] = element.getBoundingClientRect().height + "px"
    } else {
      this.overlapDetails["width"] = element.getBoundingClientRect().width + "px"
      this.overlapDetails["height"] = "100%"
    }
  }
  scrolling() {
    let scrollTop = this.renderRoot.querySelector(".table-container")?.scrollTop as number
    this.getCurrentItems(scrollTop + 30)
    if (this.selectedRowColumn) {
      if (!this.selectedColumn) {
        this.updatePropertyValue(this.selectedElement, "row")
      }
    }
  }

  render() {
    
    return html`
     <div class="table-container" tabindex=0 @keydown="${this.keyOperting}" @scroll="${this.scrolling}">        
        <div class="serial-panel panel">
            <div class="serial-header header common">
                <div>S.NO</div>
            </div>
            <div class="serial-body body" style=${styleMap({ height: this.data.rows.length * this.rowHeight + "px" })}>
              <div class=translating-element style=${styleMap({ gridAutoRows: this.rowHeight + "px", transform: "translateY(" + this.scrollTop + "px)" })}>
                  ${this.generateSerials(this.currentItems)}
              </div>
            </div>
        </div>
        <div class="content-panel panel">
          <div class="content-header" style=${styleMap({ gridTemplateColumns: "repeat(" + this.data.columns.length + ",1fr)" })}>
          ${this.generateColumns(this.data.columns)}
          </div>
          <div class="content-body body" style=${styleMap({ height: this.data.rows.length * this.rowHeight + "px" })}>
              <div class=translating-element  style=${styleMap({ gridTemplateColumns: "repeat(" + this.data.columns.length + ",1fr)", gridAutoRows: this.rowHeight + "px", transform: "translateY(" + this.scrollTop + "px)" })}>
                ${this.generateRowCells(this.currentItems)}
                ${this.selectedRowColumn ? html`<div class="overlap" style=${styleMap({ left: this.overlapDetails.left, top: this.overlapDetails.top, width: this.overlapDetails.width, height: this.overlapDetails.height })}></div>` : nothing}
              </div>
          </div>
        </div>
        ${this.editorMode ? html`<div class=editor tabindex=0 @blur=${this.bluringEditor} ?contenteditable=${this.editorMode} selected=${this.data.columns[this.selectedColumn - 1].name + this.selectedRow} style=${styleMap({ left: this.editorRect.left, top: this.editorRect.top, minWidth: this.editorRect.width, minHeight: this.editorRect.height })}>${this.data.rows[this.selectedRow - 1][this.data.columns[this.selectedColumn - 1].name]}</div>` : nothing}
     </div>
    `;
  }

}
window.customElements.define("table-component", TableComponent)