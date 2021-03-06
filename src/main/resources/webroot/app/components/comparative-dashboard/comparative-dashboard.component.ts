import { Component, AfterViewInit} from '@angular/core';
import { Result, Message } from '../../models/result';
import { ExportService } from '../../services/export.service';
import { ResultsService } from '../../services/fakeResults.service';
import { UtilsService } from '../../services/utils.service';

declare var $:any;

@Component({
    selector: 'comparartive-dashboard',
    templateUrl: '../app/components/comparative-dashboard/comparative-dashboard.component.html',
    providers: [ExportService, ResultsService, UtilsService],
    styleUrls: ['./app/components/comparative-dashboard/comparative-dashboard.component.css']
})
export class ComparativeDashboardComponent implements AfterViewInit{

  // VARS

  public app: any;
  public messages: any[] = [];
  public results:Result[] = [];
  public allResults:Result[] = [];

  public loadingCheckNodes:boolean = false;
  public allNodesValid:boolean = false;
  public doingTest:boolean = false;

  constructor(private _export: ExportService, private _resultService: ResultsService, private _utils:UtilsService){}

  async ngAfterViewInit(){
    this.allResults = await this._resultService.getResults();
    this.tabNodeNum(2);
    $('.ui.dropdown').dropdown();
  }

  public tabNodeNum(n:number){
    this.initGraphs();
    this.allResults
      .filter((result:Result)=> result.nodesMetrics.length == n)
      .forEach((result: Result) => this.addResult(result));
    this.tabf(0);
    console.log(this.results)
  }

  public initGraphs(){
    this.results = [];
    this.time_graphics = {
      data: {}
    };
    this.cpu_graphics = {
      data: {}
    };
    this.ram_graphics = {
      data: {}
    };

    this.apps = [];
    this.app_index = {};
    this.chats_index = {};
    this.selectedApp;
  }


  // COMPARATIVE VIEW

  time_graphics = {
    data: {}
  };
  cpu_graphics = {
    data: {}
  };
  ram_graphics = {
    data: {}
  };

  apps:string[] = [];
  app_index = {};
  chats_index = {};
  selectedApp:string;


  // SPECIFIC VIEW

  cpu_node_graphics = {
    data: {}
  };
  ram_node_graphics = {
    data: {}
  };
  time_node_graphics = {
    data: {}
  };
  node_index = {};


  private addResult(result:Result){
    this.results.push(result);

    let numChatsKey = 'numChats-'+result.numChats;
    if(!this.chats_index[numChatsKey]) this.chats_index[numChatsKey] = result.numChats;
    if(this.apps.indexOf(result.app) == -1) this.apps.push(result.app);
    if(!this.selectedApp) this.selectedApp = result.app;
    if(!this.globalNumChatsKey) this.globalNumChatsKey = numChatsKey;

    // TIME GRAPHICS

    if(this.time_graphics.data[numChatsKey] == undefined){
      this.time_graphics.data[numChatsKey] = {
        name: result.numChats+" room(s) - Time",
        times: []
      }
      this.cpu_graphics.data[numChatsKey] = {
        name: result.numChats+" room(s) - %CPU use",
        metrics: []
      }
      this.ram_graphics.data[numChatsKey] = {
        name: result.numChats+" room(s) - RAM use (in MBytes)",
        metrics: []
      }
      this.app_index[numChatsKey] = {};
    }

    if(this.app_index[numChatsKey][result.app] == undefined){
      // TIME
      this.time_graphics.data[numChatsKey].times.push({
        "name": result.app,
        //"name": result.app + " - "+result.numChats+" room(s) - Time",
        "series": []
      })
      // CPU
      this.cpu_graphics.data[numChatsKey].metrics.push({
        "name": result.app,
        //"name": result.app + " - "+result.numChats+" room(s) - %CPU use",
        "series": []
      })
      // RAM
      this.ram_graphics.data[numChatsKey].metrics.push({
        "name": result.app,
        //"name": result.app + " - "+result.numChats+" room(s) - Memory use (in MBytes)",
        "series": []
      })
      this.app_index[numChatsKey][result.app] = this.time_graphics.data[numChatsKey].times.length - 1;
    }

    let appIndex = this.app_index[numChatsKey][result.app];



    // METRICS GRAPHICS
    let ram:number = 0;
    let cpu:number = 0;

    for(let node of result.nodesMetrics){
      cpu += (node.cpuUse.reduceRight( (a,b) => a + b , 0) / node.cpuUse.length)
      ram += (node.ram.reduceRight( (a,b) => a + b , 0) / node.ram.length)
    }

    let numMessages = (result.numUsers * result.numUsers * 100 * result.numChats).toString();

    // TIME
    this.time_graphics.data[numChatsKey].times[appIndex].series.push({
      "name": numMessages,
      "value": result.avgTime
    });

    // CPU
    this.cpu_graphics.data[numChatsKey].metrics[appIndex].series.push({
      "name": numMessages,
      "value": cpu / result.nodesMetrics.length
    });

    // RAM
    this.ram_graphics.data[numChatsKey].metrics[appIndex].series.push({
      "name": numMessages,
      "value": ram / result.nodesMetrics.length
    });

    // FORCE UPDATE
    this.ram_graphics.data[numChatsKey].metrics = [...this.ram_graphics.data[numChatsKey].metrics];
    this.cpu_graphics.data[numChatsKey].metrics = [...this.cpu_graphics.data[numChatsKey].metrics];
    this.time_graphics.data[numChatsKey].times = [...this.time_graphics.data[numChatsKey].times];
  }

  //nodeView = [300, 100]

  public nodeGraph(name: string, numChats: number){

    this.node_index = {};

    var appResults = this.results.filter((result: Result) => result.app == name && result.numChats == numChats);
    let numChatsKey = 'numChats-'+numChats;

    delete this.cpu_node_graphics.data[numChatsKey];
    delete this.ram_node_graphics.data[numChatsKey];
    delete this.time_node_graphics.data[numChatsKey];

    for(let result of appResults){

      if(this.time_node_graphics.data[numChatsKey] == undefined){
        this.time_node_graphics.data[numChatsKey] = {
          name: result.numChats+" room(s) - Time",
          times: [{
            "name": result.app + " - "+result.numChats+" room(s) - Time",
            "series": []
          }]
        }
      }

      // TIME
      this.time_node_graphics.data[numChatsKey].times[0].series.push({
        "name": result.numUsers.toString(),
        "value": result.avgTime
      });

      if(this.cpu_node_graphics.data[numChatsKey] == undefined){
        this.cpu_node_graphics.data[numChatsKey] = {
          name: result.numChats+" room(s) - CPU use",
          nodes: []
        }
      }

      if(this.ram_node_graphics.data[numChatsKey] == undefined){
        this.ram_node_graphics.data[numChatsKey] = {
          name: result.numChats+" room(s) - RAM use",
          nodes: []
        }
      }

      for(let node of result.nodesMetrics){

        if(!this.node_index[numChatsKey]) this.node_index[numChatsKey] = {};

        if(this.node_index[numChatsKey][node.id] == undefined){
          // CPU
          this.cpu_node_graphics.data[numChatsKey].nodes.push({
            "name": node.id,
            "series": []
          })
          // RAM
          this.ram_node_graphics.data[numChatsKey].nodes.push({
            "name": node.id,
            "series": []
          })
          this.node_index[numChatsKey][node.id] = this.cpu_node_graphics.data[numChatsKey].nodes.length - 1;
        }

        let node_index = this.node_index[numChatsKey][node.id];

        // CPU
        this.cpu_node_graphics.data[numChatsKey].nodes[node_index].series.push({
          "name": result.numUsers.toString(),
          "value": node.cpuUse.reduceRight( (a,b) => a + b , 0) / node.cpuUse.length
        });

        // RAM
        this.ram_node_graphics.data[numChatsKey].nodes[node_index].series.push({
          "name": result.numUsers.toString(),
          "value": node.ram.reduceRight( (a,b) => a + b , 0) / node.ram.length
        });

      }
    }
  }

  globalNumChatsKey:string;

  public saveImg (key:any, name:any) {
   console.log(key, name)
   this._export.toPNG(key, name );
  //  switch(item.tab){
  //    case 0: this._export.toPNG( '#' + item.chatSize + '-size-times', item.title ); break;
  //    case 1: this._export.toPNG( '#' + item.chatSize + '-size-cpu', item.title ); break;
  //    case 2: this._export.toPNG( '#' + item.chatSize + '-size-memory', item.title ); break;
  //  }
 }

  public tabf(index:number){
    let keys = this.keys(this.time_graphics.data);
    this.globalNumChatsKey = keys[index];
    this.tab=index;
    this.nodeGraph(this.selectedApp, this.chats_index[this.globalNumChatsKey])
    this.forceUpdate()
  }

  public tabApp(app:string){
    this.selectedApp = app;
    this.nodeGraph(this.selectedApp, this.chats_index[this.globalNumChatsKey])
    this.forceUpdate()
  }

  private forceUpdate(){
    let keys = this.keys(this.time_graphics.data);
    // FORCE UPDATE
    for (let key of keys) {
      this.time_graphics.data[key].times = [...this.time_graphics.data[key].times];
      this.ram_graphics.data[key].metrics = [...this.ram_graphics.data[key].metrics];
      this.cpu_graphics.data[key].metrics = [...this.cpu_graphics.data[key].metrics];
    }
  }

  public getAppColor(app:string){
    return this.colorScheme.domain[this.apps.indexOf(app)];
  }

  public getAppLineColor(){
    var color = {
      domain: [this.getAppColor(this.selectedApp)]
    };
    return color;
  }

  public seeBubbleChart(){
    $('.ui.modal').modal('show');
  }

  tab:number;

  timesConfig = {
    // Chart Options
    showXAxis: true,
    showYAxis : true,
    gradient : true,
    showLegend : true,
    showXAxisLabel : true,
    xAxisLabel : 'Nº of messages',
    showYAxisLabel : true,
    yAxisLabel : 'Time (in milliseconds)'
  }

  cpuConfig = {
    // Chart Options
    showXAxis: true,
    showYAxis : true,
    gradient : true,
    showLegend : true,
    showXAxisLabel : true,
    xAxisLabel : 'Nº of messages',
    showYAxisLabel : true,
    yAxisLabel : '% CPU used'
  }

  ramConfig = {
    // Chart Options
    showXAxis: true,
    showYAxis : true,
    gradient : true,
    showLegend : true,
    showXAxisLabel : true,
    xAxisLabel : 'Nº of messages',
    showYAxisLabel : true,
    yAxisLabel : 'RAM used (MBytes)'
  }

  timesNodeConfig = {
    // Chart Options
    showXAxis: true,
    showYAxis : true,
    gradient : true,
    showLegend : false,
    showXAxisLabel : true,
    xAxisLabel : 'Nº of messages',
    showYAxisLabel : true,
    yAxisLabel : 'Time (in milliseconds)'
  }

  cpuNodeConfig = {
    // Chart Options
    showXAxis: true,
    showYAxis : true,
    gradient : true,
    showLegend : false,
    showXAxisLabel : true,
    xAxisLabel : 'Nº of messages',
    showYAxisLabel : true,
    yAxisLabel : '% CPU used'
  }

  ramNodeConfig = {
    // Chart Options
    showXAxis: true,
    showYAxis : true,
    gradient : true,
    showLegend : false,
    showXAxisLabel : true,
    xAxisLabel : 'Nº of messages',
    showYAxisLabel : true,
    yAxisLabel : 'RAM used (MBytes)'
  }

  colorScheme = {
    domain: ['#B901FC', '#5AA454', '#A10A28', '#C7B42C', '#AAAAAA']
  };

  timeColor = {
    domain: ['#0c4fab']
  };

  metricsColors = {
    domain: ['#B03060','#FE9A76','#FFD700']
  }

  public keys(object: Object){
    return Object.keys(object);
  }

  private find(array: Object[], key:string, value:any){
    for (let i = 0; i < array.length; i++) {
        if(array[i][key]==value){
          return i;
        };
    }
  }

  public bubbleData = [
        {
          "name": "Akka",
          "series": [
            {
              "name": "Akka",
              "x": 51,
              "y": 257,
              "r": 1132*10
            }
          ]
        },
        {
          "name": "Vert.x",
          "series": [
            {
              "name": "Vert.x",
              "x": 31,
              "y": 236,
              "r": 380*10
            }
          ]
        },
        {
          "name": "RabbitMQ",
          "series": [
            {
              "name": "RabbitMQ",
              "x": 67,
              "y": 428,
              "r": 6680*10
            }
          ]
        },
        {
          "name": "Hazelcast",
          "series": [
            {
              "name": "Hazelcast",
              "x": 30,
              "y": 326,
              "r": 4477*10
            }
          ]
        },
      ]

}
