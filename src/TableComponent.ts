import { html, css, LitElement, PropertyValueMap, PropertyDeclarations, nothing } from 'lit';
import { tableData } from './index';
import { property, state } from 'lit/decorators.js';
import { map } from 'lit/directives/map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { classMap } from 'lit/directives/class-map.js';

export class TableComponent extends LitElement {
  constructor() {
    super()
    this.data = this.getTableData()
  }
  
  data!: { columns: { name: string, editable: boolean }[], rows: {}[] }
  @state()
  extraElement!: number
  startingPoint!: number
  rowPerBlock!: number
  @property({ type: Number })
  rowHeight!: number
  @state()
  scrollTop!: number
  currentItems!: any[]
  @state()
  selectedRow!: number;
  @state()
  selectedColumn!: string
  @state()
  overlapDetails: Partial<{ left: string, top: string, width: string, height: string }> = {}
  @state()
  selectedRowColumn: boolean = false  

  protected firstUpdated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {   
    this.initializing()
  }
  get tableHeight() {
    let tableElement = this.renderRoot.querySelector(".table-container") as HTMLElement
    return tableElement?.getBoundingClientRect().height
  }
  getTableData() {
      return tableData
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
      grid-auto-rows:30px
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
  `;
  generateColumns(columnArray: any[]) {
    return html`${map(columnArray, (item) => {
      return html`<div class="header common cells ${classMap({ hightlightRowColumn: this.selectedColumn == item.name })}" @click="${(event: any) => { this.highlightColumn(item.name, event.target) }}">${item.name}</div>`
    })}`
  }
  generateSerials(serials: any[]) {
    return html`${map(serials, (item, index) => {
      index = index + this.startingPoint + 1
      return html`<div class="common ${classMap({ hightlightRowColumn: this.selectedRow == index })}" @click="${(event: any) => { this.hightlightRow(index, event.target) }}">${index}</div>`
    })}`
  }
  generateRowCells(rows: any[]) {
    return html`${map(rows, (rowItem) => {
      return html`${map(this.data.columns, (columnItem) => {        
        return html`<div class="common cells " >${rowItem[columnItem.name]}</div>`     
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
    this.selectedColumn = ''
    this.selectedRowColumn = true    
    this.selectedRow = rowNumber
    this.updatePropertyValue(element, "row")

  }
  highlightColumn(columnName: string, element: HTMLElement) {
    this.selectedRowColumn = true    
    this.selectedRow = 0
    this.selectedColumn = columnName
    this.updatePropertyValue(element, "column")
  }
  highlightCell(rowIndex:number,columnName:string){
    this.selectedRow=rowIndex
    this.selectedColumn=columnName
  }
  updatePropertyValue(element: HTMLElement, selected: "row" | "column") {
    this.overlapDetails["left"] = element.offsetLeft + "px"
    this.overlapDetails["top"] = element.offsetTop + "px"
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
  }
  render() {
    return html`
     <div class="table-container" @scroll="${this.scrolling}">
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
              <div class=translating-element style=${styleMap({ gridTemplateColumns: "repeat(" + this.data.columns.length + ",1fr)", gridAutoRows: this.rowHeight + "px", transform: "translateY(" + this.scrollTop + "px)" })}>
                ${this.generateRowCells(this.currentItems)}
                ${this.selectedRowColumn ? html`<div class="overlap" style=${styleMap({ left: this.overlapDetails.left, top: this.overlapDetails.top, width: this.overlapDetails.width, height: this.overlapDetails.height })}></d  v>` : nothing}
              </div>
          </div>
        </div>
     </div>
    `;
  }

}
window.customElements.define("table-component", TableComponent)