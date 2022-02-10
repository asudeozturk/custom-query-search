
import './App.css';
import 'semantic-ui-css/semantic.min.css';
import { Grid, Form, Dropdown, Header, Label, Checkbox, Button, Input, GridColumn, Table, TableHeaderCell, Pagination, TableHeader, Segment, Icon} from 'semantic-ui-react';
import React, {useEffect, useState} from "react"; 
import { restaurantOptions, getData, postData, getCompareType} from './Utility';

import 'react-dates/initialize';
import {DateRangePicker} from 'react-dates';
import 'react-dates/lib/css/_datepicker.css';

import TimePicker from 'rc-time-picker';
import 'rc-time-picker/assets/index.css';
import moment from 'moment';

function App() {
  const [restaurantIds, setRestaurantIds] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [measures, setMeasure] = useState('LessThan');
  const [compareValue, setCompareValue] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [focusedInput, setFocusedInput] = useState(null);
  const [startTime, setStartTime] = useState("6");
  const [endTime, setEndTime] = useState("5");
  const [metricDefinitions, setMetricDefinitions] = useState([]);

  const firstMetric = {
    "metricCode": "",
    "compareType": "",
    "value": 0
  };
  const [metricQuery, setMetricQuery] = useState([firstMetric]);

  const [isSubmitted, setSubmitted] = useState(false);
  const [results, setResults] = useState([]);

  const [activePage, setActivePage] = useState(1);



  const metricOptions= metricDefinitions.map((metric, index) => {
        return {
          key: index,
          text: metric.alias,
          value: metric.metricCode
        }
  });

  function getResultsTable() {
    return <Grid.Row>
              <GridColumn className="resultsSection">
                <Header as="h2">Results</Header>
              
                <Segment className='resultHeaderSegment'>
                  <Segment className='criteriaSegment'>
                    {metricQuery.map((metric, index) => {
                    return <p className="criteria">
                            {metricDefinitions.find(x => x.metricCode === metric.metricCode).alias} {getCompareType(metric.compareType)} {metric.value} 
                          </p>;})
                    }
                  </Segment>
                  <Pagination
                  activePage={activePage}
                  onPageChange={(event,data)=>onPaginationChange(data.activePage)}
                  totalPages={Math.ceil(results.length/10)}
                />
                </Segment>
          
                <Table celled collapsing>
                  {getColumns()}
                  {getRows(activePage)}
                </Table>
            </GridColumn>
          </Grid.Row>
  }
  function getColumns() {
    return <TableHeader>
            <Table.Row>
              <TableHeaderCell>Restaurant Id</TableHeaderCell>
              <TableHeaderCell>Transaction Date</TableHeaderCell>
              <TableHeaderCell>Transaction Time</TableHeaderCell>
              <TableHeaderCell>Ticket Number</TableHeaderCell>
              { metricDefinitions.map((metric, index) => {
                return <TableHeaderCell>{metric.alias}</TableHeaderCell>;})
              }
            </Table.Row>
          </TableHeader>;
  }
  function getRows(activePage) {
    return <Table.Body>
              {results.slice((activePage-1)*10, (activePage-1)*10 + 10).map((result,index) => { 
                return <Table.Row>
                        <Table.Cell>{result.restaurantId}</Table.Cell>
                        <Table.Cell>{convertDate(result.busDt)}</Table.Cell>
                        <Table.Cell>{convertTime(result.orderTime)}</Table.Cell>
                        <Table.Cell>{result.orderNumber}</Table.Cell>

                        {metricDefinitions.map(metricDef => {
                            var key = metricDef.metricCode;
                            key = key.charAt(0).toLowerCase() + key.slice(1); //make first letter lowercase so it matches with API property names
                            return <Table.Cell>{convertData(metricDef,result[key])}</Table.Cell>;
                        })}
                       
                      </Table.Row>
                ;})
              }
            </Table.Body>;
  }

  function convertDate(date) {
    var m = moment(date);
    var newFormat = m.format('MM/DD/YYYY');

    return newFormat;
  }
  function convertTime(time) {
    var m = moment(time);
    var newFormat = m.format('h:mm A');

    return newFormat;
  }
  function convertData(metricDef, data){
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

  
  function onSubmit() {
    const queryRequest = {
      restaurantIds: restaurantIds,
      fromDate: startDate.format("YYYY-MM-DDTHH:mm:ss.SSSZ"),
      toDate: endDate.format(("YYYY-MM-DDTHH:mm:ss.SSSZ")),
      fromHour: parseInt(startTime),
      toHour: parseInt(endTime),
      metricCriteria: metricQuery
    };

    console.log(queryRequest);
    
      postData("https://customsearchquerytoolapi.azurewebsites.net/Search/Query", queryRequest)
      .then(data=>{
          console.log(data);
          setResults(data);
      })
      .catch(err => {
        console.log(err);
      });
      setSubmitted(true);
  }
  
  function updateQuery(value, index, attribute) {
    const newMetricQuery = [];
    for(var i = 0; i<metricQuery.length; i++) {
      newMetricQuery.push(metricQuery[i]);
    }
    newMetricQuery[index][attribute] = value;
    setMetricQuery(newMetricQuery);
  }

  function deleteQuery(index) {
    const newMetricQuery = [];
    for(var i = 0; i<metricQuery.length; i++) {
      newMetricQuery.push(metricQuery[i]);
    }
    newMetricQuery.splice(index,1);
    setMetricQuery(newMetricQuery);
  }

  function checkLength(index) {
    if(metricQuery.length > 1) {
      return <>
              <Grid.Column>
                <Button icon type="button" onClick={(event, data) => deleteQuery(index)} className="deleteButton" floated="right">
                  <Icon name="delete" />
                </Button>
              </Grid.Column>
          </>;
    }
  }

  useEffect(() => {
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
    setStartTime( value.format('H') );
  };
  const onEndTimeChange = value => {
    setEndTime( value.format('H'));
  };
  const onPaginationChange = activePage => {

    setActivePage(activePage);
    getColumns(activePage);
  };

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
                  >
                  </Dropdown>
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
                    defaultValue={moment().hour(5)}
                    onChange={onEndTimeChange}
                  />
                </Form.Field>
              </Segment>
              
              <Header as="h2" className="sectionHeader metric">Metric Selection</Header>
              <Button type="button" className="addButton" floated="right" onClick={(event, data) => {
                      if(metricQuery.length ===5 ){
                        return;
                      }
                      const newMetricQuery = [];
                      for(var i = 0; i<metricQuery.length; i++) {
                        newMetricQuery.push(metricQuery[i]);
                      }
                      newMetricQuery.push({
                        "metricCode": metrics,
                        "compareType": measures,
                        "value": parseFloat(compareValue)
                      });
                      setMetricQuery(newMetricQuery);
                      }}
                    >
                      ADD CRITERIA
                    </Button>
              {metricQuery.map((criteria, index) => {
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
                                      onChange={(event, data) => updateQuery(data.value, index, "metricCode")}
                                    >
                                    </Dropdown>
                                </Form.Field>
                    
                                <Form.Field>
                                  <Header as='h3'>Compare Type</Header>
                                  <Checkbox
                                    radio
                                    label='<'
                                    name='measureGroup'
                                    value='LessThan'
                                    checked={criteria.compareType === 'LessThan'}
                                    onChange={(event, data) => updateQuery(data.value, index, "compareType")}
                                  />
                                  <Checkbox
                                    radio
                                    label='<='
                                    name='measureGroup'
                                    value='LessThanOrEqual'
                                    checked={criteria.compareType === 'LessThanOrEqual'}
                                    onChange={(event, data) => updateQuery(data.value, index, "compareType")}
                                  />
                                  <Checkbox
                                    radio
                                    label='='
                                    name='measureGroup'
                                    value='Equal'
                                    checked={criteria.compareType === 'Equal'}
                                    onChange={(event, data) => updateQuery(data.value, index, "compareType")}
                                  />
                                  <Checkbox
                                    radio
                                    label='>='
                                    name='measureGroup'
                                    value='GreaterThanOrEqual'
                                    checked={criteria.compareType === 'GreaterThanOrEqual'}
                                    onChange={(event, data) => updateQuery(data.value, index, "compareType")}
                                  />
                                  <Checkbox
                                    radio
                                    label='>'
                                    name='measureGroup'
                                    value='GreaterThan'
                                    checked={criteria.compareType === 'GreaterThan'}
                                    onChange={(event, data) => updateQuery(data.value, index, "compareType")}
                                  />              
                                </Form.Field>

                                <Form.Field>
                                  <Header as='h3'>Value</Header>
                                  <Input 
                                    type='number'
                                    placeholder='0'
                                    step='any'
                                    value={criteria.value}
                                    onChange={(event, data) => updateQuery(parseFloat(data.value), index, "value")}
                                    required
                                    className='valueInput'
                                  >
                                  </Input>
                                </Form.Field>
                              </Grid.Column>
                              
                              {checkLength(index)}
                              
                            </Grid.Row>
                        </Grid>
                     </Segment>;
              })}
              

              <Form.Field>
                  
                </Form.Field>
              <Form.Field className='submitField'>
                <Button type="submit" >SEARCH</Button>
              </Form.Field>
            </Form>
          </Grid.Column>
        </Grid.Row>
        
        {isSubmitted ? getResultsTable() : <></>}
      
      </Grid>
      
    </div>
  );
}

export default App;
