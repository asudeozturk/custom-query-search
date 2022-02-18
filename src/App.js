
import './App.css';
import 'semantic-ui-css/semantic.min.css';
import 'react-dates/initialize';
import 'react-dates/lib/css/_datepicker.css';
import 'rc-time-picker/assets/index.css';
import { restaurantOptions, getData, postData, getCompareType, getColor} from './Utility';
import { Grid, GridColumn, Segment, Ref, Header, Label} from 'semantic-ui-react';
import { Form, Dropdown, Checkbox, Input,Button, Icon} from 'semantic-ui-react';
import { Table, TableHeader, TableHeaderCell, Pagination } from 'semantic-ui-react';
import { LineChart,Line, XAxis, YAxis, CartesianGrid,Tooltip,Legend,ResponsiveContainer} from "recharts";
import React, {useEffect, useState, PureComponent} from "react"; 
import {DateRangePicker} from 'react-dates';
import TimePicker from 'rc-time-picker';
import moment from 'moment';

function App() {
  const rowPerPage = 10;
  const defaultCriteria = {
    "metricCode": "",
    "compareType": "LessThan",
    "value": 0
  };
  const scrollToResults = React.useRef(null);

  const [restaurantIds, setRestaurantIds] = useState([]);
  const [startDate, setStartDate] = useState(null); //Moment object
  const [endDate, setEndDate] = useState(null); //Moment object
  const [focusedInput, setFocusedInput] = useState(null);
  const [startTime, setStartTime] = useState(6); //6am
  const [endTime, setEndTime] = useState(29); //5am next day

  const [metricDefinitions, setMetricDefinitions] = useState([]);
  const [isSubmitted, setSubmitted] = useState(false); //if true, shows results 
  const [metricQuery, setMetricQuery] = useState([defaultCriteria]); //criteria
  const [results, setResults] = useState([]);       //results from API
  const [activePage, setActivePage] = useState(1);  //pagination

  const metricOptions = metricDefinitions.map((metric, index) => {
    return {
      key: index,
      text: metric.alias,
      value: metric.metricCode
    }
  });

  useEffect(() => { //load metric definitions from API
    getData("https://customsearchquerytoolapi.azurewebsites.net/Search/MetricDefinitions")
    .then(data=>{
        setMetricDefinitions(data);
    })
    .catch(err => {
      console.log("Error");
    });
    
  }, []);
 
  const onDatesChange = ({ startDate, endDate }) => {
    setStartDate(startDate);
    setEndDate(endDate);
  };
  const onStartTimeChange = value => {
    var time = parseInt(value.format('H'));
    setStartTime(time);
    if(time < (endTime-24)){ //update endTime when startTime changes
      setEndTime(endTime-24); 
    }
    else if(time > (endTime)){
      setEndTime(endTime+24);
    }
  };
  const onEndTimeChange = value => {
    var time = parseInt(value.format('H'));
    if(time < startTime) { //next day
        time += 24;
    }
    setEndTime(time);
  };

  function onUpdateCriteria(value, index, attribute) {
    const newMetricQuery = [];
    for(var i = 0; i<metricQuery.length; i++) {
      newMetricQuery.push(metricQuery[i]);
    }
    newMetricQuery[index][attribute] = value;
    setMetricQuery(newMetricQuery);
  }
  function onAddCriteria() { //when add criteria button clicked
    setSubmitted(false); 
    const newMetricQuery = [];
    for(var i = 0; i<metricQuery.length; i++) {
      newMetricQuery.push(metricQuery[i]);
    }
    newMetricQuery.push(defaultCriteria);
    setMetricQuery(newMetricQuery);
  }
  function onDeleteCriteria(index) { //when delete criteria button clicked
    const newMetricQuery = [];
    for(var i = 0; i<metricQuery.length; i++) {
      newMetricQuery.push(metricQuery[i]);
    }
    newMetricQuery.splice(index,1);
    setMetricQuery(newMetricQuery);
  }
  function onPaginationChange(activePage) {
    setActivePage(activePage);
    getColumns(activePage); //show results on the table
  }
  function onSubmit() {
    const queryRequest = {
      restaurantIds: restaurantIds,
      fromDate: startDate.format("YYYY-MM-DDTHH:mm:ss.SSSZ"),
      toDate: endDate.format(("YYYY-MM-DDTHH:mm:ss.SSSZ")),
      fromHour: startTime,
      toHour: endTime,
      metricCriteria: metricQuery
    }; 

    console.log(queryRequest);
    
    postData("https://customsearchquerytoolapi.azurewebsites.net/Search/Query", queryRequest)
    .then(data=>{
        console.log(data);
        setResults(data); //receive results from API
        setSubmitted(true); //used for showing the table when form is submitted
        scrollToResults.current.scrollIntoView();
      })
    .catch(err => {
      console.log(err);
    });
    
  }

  
 
  function getResultsGraph() { //create line chart
    const dailyAverages = getAverages();
    return <Grid.Row>
            <GridColumn className="resultsSection">
             <Header as="h2" className="sectionTitle">Daily Average Values by Metric</Header>
              <ResponsiveContainer height={600} width="100%">
                <LineChart 
                  margin={{
                  top: 10,
                  right: 30,
                  left: 0,
                  bottom: 50,
                  }}
                  data={dailyAverages}
                > 
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" angle={90} dy={35} dx={5} interval={0}/>
                  <YAxis/>
                  <Tooltip />
                  <Legend verticalAlign="top" 
                    height={36} 
                    iconSize={20} 
                    iconType="square"
                    formatter={renderLabel}
                  />
                  {metricQuery.map((metric, index) => { //get Line for each metric
                    var key = metric.metricCode;
                    return <Line type="monotone"  
                              strokeWidth={3} 
                              dataKey={key}
                              connectNulls 
                              label={<CustomizedLabel />}
                              stroke={getColor(index)}
                          />;
                  })}
                </LineChart>
              </ResponsiveContainer>
            </GridColumn>
          </Grid.Row>
  }

  function getAverages() { //for line chart: put metric averages of each day in array
    const averages =[];
    var date = moment(startDate);
    while(date.isSameOrBefore(endDate)) { 
      averages.push(calculateAverages(date));
      date.add(1,'days');
    }
    return averages;
  }
  function calculateAverages(date) { //for line chart: find averages for the given day
    const dateString = date.format("YYYY-MM-DDT00:mm:ss");

    const resultOnDate = results.filter((result) => result.busDt === dateString);
    date = {
      "date": date.format("MM/DD/YYYY")
    };
   
    for(var i=0; i<metricQuery.length;i++){ //for each metric, calculate its average, add result to date object
      var metric = metricQuery[i].metricCode;
      var key = metric.charAt(0).toLowerCase() + metric.slice(1);
      
      var sum = 0;
      for(var j =0; j < resultOnDate.length; j++) {
        sum += parseFloat(resultOnDate[j][key]);
      }
      const type = metricDefinitions.find(x =>  x.metricCode === metric).dataType;
      
      //if metric type is quantity, round down to nearest integer
      const average = type==="Number" ? Math.floor(sum/resultOnDate.length) :  
                                        (sum/resultOnDate.length).toFixed(2);
      date[metric] = average; //new property
    }
    return date;
  }

  class CustomizedLabel extends PureComponent { //for line chart: customize labels of line chart
    render() {
      const { x, y, stroke, value } = this.props;
      return (
        <text x={x} y={y} dy={-4} fill={stroke} fontSize={18} textAnchor="middle">
          {value}
        </text>
      );
    }
  }
  const renderLabel = (value, entry) => { //for line chart: show metric alias instead of metricCode
    const { color } = entry;
    const label = metricDefinitions.find(x => x.metricCode === value).alias;
    return <span style={{ color }}>{label}</span>;
  };

  function getResultsTable() { //create table
    return <Grid.Row>
              <GridColumn className="resultsSection">
                <Ref innerRef={scrollToResults}>
                  <Header as="h2" className="sectionTitle">Results</Header>
                </Ref>
                <Segment className='resultHeaderSegment'>
                  <Segment className='criteriaSegment'>
                    {metricQuery.map((metric, index) => { //shows all criteria in single line, above the table
                      return <p className="criteria">
                              {metricDefinitions.find(x =>  x.metricCode === metric.metricCode).alias} 
                              {getCompareType(metric.compareType)} {metric.value} 
                            </p>;
                        })
                    }
                  </Segment>
                  <Pagination
                    activePage={activePage}
                    onPageChange={(event,data)=>onPaginationChange(data.activePage)}
                    totalPages={Math.ceil(results.length/rowPerPage)}
                  />
                </Segment>
                
                <Table celled collapsing >
                  {getColumns()}
                  {getRows(activePage)}
                </Table>
              </GridColumn>
          </Grid.Row>
  }
  function getColumns() { //for table: add column names
    return <TableHeader>
            <Table.Row>
              <TableHeaderCell>Restaurant Id</TableHeaderCell>
              <TableHeaderCell>Transaction Date</TableHeaderCell>
              <TableHeaderCell>Transaction Time</TableHeaderCell>
              <TableHeaderCell>Ticket Number</TableHeaderCell>
              {metricDefinitions.map((metric) => {
                return <TableHeaderCell>{metric.alias}</TableHeaderCell>;
              })}
            </Table.Row>
          </TableHeader>;
  }
  function getRows(activePage) { //for table: fill rows with data
    return <Table.Body>
              {results.slice((activePage-1)*rowPerPage, (activePage-1)*rowPerPage + rowPerPage).map((result) => { //get results based on activePage
                return <Table.Row>
                        <Table.Cell>{result.restaurantId}</Table.Cell>
                        <Table.Cell>{formatDate(result.busDt)}</Table.Cell>
                        <Table.Cell>{formatTime(result.orderTime)}</Table.Cell>
                        <Table.Cell>{result.orderNumber}</Table.Cell>

                        {metricDefinitions.map(metricDef => {
                            var key = metricDef.metricCode;
                            key = key.charAt(0).toLowerCase() + key.slice(1); //make first letter lowercase so it matches with API property names
                            return <Table.Cell>{formatData(metricDef,result[key])}</Table.Cell>;
                        })}
                      </Table.Row>;
              })}
            </Table.Body>;
  }

  function formatDate(date) {
    return moment(date).format('MM/DD/YYYY');
  }
  function formatTime(time) {
    return moment(time).format('h:mm A');
  }
  function formatData(metricDef, data){
    const type = metricDef.dataType;
    const decimal = metricDef.decimalPlaces;
    if(type === "Money") {
      return "$" + Number(data).toFixed(decimal); 
    }
    else if(type === "Percent") {
      return Number(data).toFixed(decimal) +"%"; 
    }
    else { //Number
      return Number(data).toFixed(decimal);
    }
  }

  return (
    <div className="App">
      <Header as="h1" className="title">Custom Query Search Tool</Header>
      <Grid className="Grid">
        <Grid.Row>
          <Grid.Column>
            <Form onSubmit={(event, data) => onSubmit()}>
              <Header as="h2" className="sectionHeader">Restaurant and Transaction Information</Header>
              <Segment className="formSegment">
                <Form.Field>
                  <Header as='h3'>Restaurant ID</Header>
                  <Dropdown
                    options={restaurantOptions}
                    multiple
                    selection
                    placeholder="Select"
                    value={restaurantIds}
                    onChange={(event, data) => setRestaurantIds(data.value)}
                  />
                </Form.Field>

                <Form.Field>
                  <Header as='h3'>Date</Header>
                  <DateRangePicker
                    startDate={startDate}
                    startDateId="startDate"
                    endDate={endDate}
                    endDateId="endDate"
                    onDatesChange={onDatesChange}
                    focusedInput={focusedInput}
                    onFocusChange={focusedInput => setFocusedInput(focusedInput)}
                    required
                    isOutsideRange={() => false}
                    noBorder={true}
                  />
                </Form.Field>

                <Form.Field>
                  <Header as='h3'>Transaction Time</Header>
                  <Label>From</Label>
                  <TimePicker
                    format='h a'
                    use12Hours
                    inputReadOnly
                    showSecond={false}
                    showMinute={false}
                    defaultValue={moment().hour(6)}
                    onChange={onStartTimeChange} 
                  />
                  <Label className="toTimeLabel">To</Label>
                  <TimePicker
                    format='h a'
                    use12Hours
                    inputReadOnly
                    showSecond={false}
                    showMinute={false}
                    defaultValue={moment().hour(29)}
                    onChange={onEndTimeChange}
                  />
                  { endTime>24 ? //warning message if endTime is next day
                    <p className="nextDay">* {endTime-24}a.m. next day</p>: <></>
                  }
                </Form.Field>
              </Segment>
              
              <Header as="h2" className="sectionHeader metric">Metric Selection</Header>
              
              {metricQuery.length !== 5 ? //add Add Criteria button
                <Button type="button" className="addButton" floated="right" onClick={(event, data) => onAddCriteria()}>
                  ADD CRITERIA
                </Button> :
                <></>
              }
              
              {metricQuery.map((criteria, index) => {  //add components for criteria
                return <Segment key={index} className="formSegment">
                        <Grid columns={2} stackable>
                          <Grid.Row verticalAlign='top'>
                              <Grid.Column>
                                <Form.Field>
                                  <Header as='h3'>Metric</Header>
                                    <Dropdown
                                      options={metricOptions}
                                      selection
                                      placeholder="Select"
                                      className="metricInputs"
                                      value={criteria.metricCode}
                                      onChange={(event, data) => onUpdateCriteria(data.value, index, "metricCode")}
                                    />
                                </Form.Field>
                                <Form.Field>
                                  <Header as='h3'>Compare Type</Header>
                                  <Checkbox
                                    radio
                                    label='<'
                                    name='measureGroup'
                                    value='LessThan'
                                    checked={criteria.compareType === 'LessThan'}
                                    onChange={(event, data) => onUpdateCriteria(data.value, index, "compareType")}
                                  />
                                  <Checkbox
                                    radio
                                    label='<='
                                    name='measureGroup'
                                    value='LessThanOrEqual'
                                    checked={criteria.compareType === 'LessThanOrEqual'}
                                    onChange={(event, data) => onUpdateCriteria(data.value, index, "compareType")}
                                  />
                                  <Checkbox
                                    radio
                                    label='='
                                    name='measureGroup'
                                    value='Equal'
                                    checked={criteria.compareType === 'Equal'}
                                    onChange={(event, data) => onUpdateCriteria(data.value, index, "compareType")}
                                  />
                                  <Checkbox
                                    radio
                                    label='>='
                                    name='measureGroup'
                                    value='GreaterThanOrEqual'
                                    checked={criteria.compareType === 'GreaterThanOrEqual'}
                                    onChange={(event, data) => onUpdateCriteria(data.value, index, "compareType")}
                                  />
                                  <Checkbox
                                    radio
                                    label='>'
                                    name='measureGroup'
                                    value='GreaterThan'
                                    checked={criteria.compareType === 'GreaterThan'}
                                    onChange={(event, data) => onUpdateCriteria(data.value, index, "compareType")}
                                  />              
                                </Form.Field>
                                <Form.Field>
                                  <Header as='h3'>Value</Header>
                                  <Input 
                                    type='number'
                                    placeholder='0'
                                    step='any'
                                    value={criteria.value}
                                    onChange={(event, data) => onUpdateCriteria(parseFloat(data.value), index, "value")}
                                    required
                                    className="metricInputs"
                                  />
                                </Form.Field>
                              </Grid.Column>

                              {metricQuery.length !== 1 ? //add Delete Criteria button
                                <Grid.Column>
                                  <Button icon type="button" className="deleteButton" floated="right" onClick={(event, data) => onDeleteCriteria(index)}>
                                    <Icon name="delete" />
                                  </Button>
                                </Grid.Column> :
                                <></>
                              }
                          </Grid.Row>
                        </Grid>
                     </Segment>;
              })}
              
              <Form.Field className='submitField'>
                <Ref>
                  <Button type="submit">SEARCH</Button>
                </Ref>
              </Form.Field>
            </Form>
          </Grid.Column>
        </Grid.Row>
        
        {isSubmitted ? getResultsTable() : <></>}
        {isSubmitted ? getResultsGraph() : <></>}
      </Grid>

    </div>
  );
}

export default App;
