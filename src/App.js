
import './App.css';
import 'semantic-ui-css/semantic.min.css';
import { Grid, Form, Dropdown, Header, Label, Checkbox, Button, Input, GridColumn, Table} from 'semantic-ui-react';
import React, {useEffect, useState} from "react"; 
import { restaurantOptions, getData, postData} from './Utility';

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
  const [metricQuery, setMetricQuery] = useState([]);

  const [isSubmitted, setSubmitted] = useState(false);
  const [results, setResults] = useState([]);

  const metricOptions= metricDefinitions.map((metric, index) => {
        return {
          key: index,
          text: metric.alias,
          value: metric.metricCode
        }
  });
  function getColumns() {
    let columns = [];
    metricOptions.forEach(element => columns.push(element.text));
    return columns;
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
          setResults(data);
      })
      .catch(err => {
        console.log(err);
      });
      setSubmitted(true);
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

  return (
    <div className="App">
      <Grid className="Grid">
        <Grid.Row>
          <Grid.Column>
            <Form onSubmit={(event, data) => onSubmit()}>
                <Form.Field>
                  <Header as='h2'>Restaurant ID</Header>
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
                  <Header as='h2'>Date</Header>
                  <Label>From</Label>
                  <Label>To</Label>
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
                  />
                </Form.Field>

                <Form.Field>
                  <Header as='h2'>Transaction Time</Header>
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
                  <Label>To</Label>
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
                
                <Form.Field>
                  <Header as='h2'>Select Metric</Header>
                  <Dropdown
                    options={metricOptions}
                    selection
                    placeholder="Select"
                    onChange={(event, data) => setMetrics(data.value)}
                  >
                  </Dropdown>
              </Form.Field>
                
              <Form.Field>
                <Header as='h2'>Select Measure</Header>
                <Checkbox
                  radio
                  label='<'
                  name='measureGroup'
                  value='LessThan'
                  checked={measures === 'LessThan'}
                  onChange={(event, data) => setMeasure(data.value)}
                />
                <Checkbox
                  radio
                  label='<='
                  name='measureGroup'
                  value='LessThanOrEqual'
                  checked={measures === 'LessThanOrEqual'}
                  onChange={(event, data) => setMeasure(data.value)}
                />
                <Checkbox
                  radio
                  label='='
                  name='measureGroup'
                  value='Equal'
                  checked={measures === 'Equal'}
                  onChange={(event, data) => setMeasure(data.value)}
                />
                <Checkbox
                  radio
                  label='>='
                  name='measureGroup'
                  value='GreaterThanOrEqual'
                  checked={measures === 'GreaterThanOrEqual'}
                  onChange={(event, data) => setMeasure(data.value)}
                />
                <Checkbox
                  radio
                  label='>'
                  name='measureGroup'
                  value='GreaterThan'
                  checked={measures=== 'GreaterThan'}
                  onChange={(event, data) => setMeasure(data.value)}
                />              
              </Form.Field>
              <Form.Field>
                <Header as='h2'>Enter Value</Header>
                <Input 
                  type='number'
                  placeholder='0'
                  step='any'
                  value={compareValue}
                  onChange={(event, data) => setCompareValue(data.value)}
                  required
                >
                </Input>
              </Form.Field>
              <Form.Field>
                <Button type="button" onClick={(event, data) => {
                    const newMetricQuery = [];
                    for(var i = 0; i<metricQuery.length; i++) {
                      newMetricQuery.push(metricQuery[i]);
                    }
                    newMetricQuery.push({
                      "metricCode": metrics,
                      "compareType": measures,
                      "value": parseInt(compareValue)
                    });
                    setMetricQuery(newMetricQuery);
                    }}
                  >
                    Add Criteria
                  </Button>
                </Form.Field>
                    
                <Form.Field>
                  <Button type="submit">SEARCH</Button>
                </Form.Field>
            </Form>
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <GridColumn>
          {isSubmitted ? 
            (<p>Table</p>): //will add table
            (<p></p>)
            
          }
          </GridColumn>
        </Grid.Row>
      </Grid>
      
    </div>
  );
}

export default App;
