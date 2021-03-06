import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { withStyles } from 'material-ui/styles';
import Grid from 'material-ui/Grid';
import MenuItem from 'material-ui/Menu/MenuItem';
import TextField from 'material-ui/TextField';
import Typography from 'material-ui/Typography';

import countBy from 'lodash.countby';

import MyMap from './MyMap';
import { niceNumber } from '../utils';

class MapContainer extends Component {
  constructor() {
    super();

    this.state = {
      selectedId: 0,
    };

    this.handleStationChange = this.handleStationChange.bind(this);
    this.handleSelectChange = this.handleSelectChange.bind(this);
    this.handleZoomChange = this.handleZoomChange.bind(this);
    this.findTopStations = this.findTopStations.bind(this);
  }

  handleStationChange(selectedId, updateCenter = false) {
    if (updateCenter) {
      const { stations, stationIndices } = this.props;
      const station = stations[stationIndices[selectedId]];
      const center = station
        ? { lat: station.latitude, lng: station.longitude }
        : { lat: 37.78637526861584, lng: -122.40490436553954 };
      const zoom = 14;

      this.setState({ center, zoom });
    }

    this.setState({ selectedId });
  }

  handleSelectChange(e) {
    this.handleStationChange(e.target.value, true);
  }

  handleZoomChange(zoom) {
    this.setState({ zoom });
  }

  findTopStations(selectedId) {
    const destTrips = this.props.trips.filter(
      t => t.start_station.id === selectedId
    );

    let destCounts = countBy(destTrips, t => t.end_station.id);
    let result = Object.keys(destCounts).map(function(key) {
      return { id: Number(key), trips: destCounts[key] };
    });

    return result
      .sort((a, b) => a.trips - b.trips)
      .reverse()
      .slice(0, 10);
  }

  renderDestination(id, index, count) {
    const { stations, stationIndices } = this.props;
    const i = stationIndices[id];
    const station = stations[i];

    return (
      <Grid container key={station.id} justify="space-between">
        <Grid>
          <Typography variant="body1">
            {index + 1}. {station.name.replace(/\(.*\)/, '')}
          </Typography>
        </Grid>
        <Grid item>
          <Typography variant="body1">{niceNumber(count)} trips</Typography>
        </Grid>
      </Grid>
    );
  }

  renderDestinationList(topStations) {
    return (
      topStations && (
        <div>
          <Typography
            variant="body2"
            className={this.props.classes.destination}
          >
            Top 10 Destinations
          </Typography>
          {topStations.map((s, i) => this.renderDestination(s.id, i, s.trips))}
        </div>
      )
    );
  }

  findCenter(stations) {
    const s1 = stations[0];
    const coordinates = {
      x1: s1.latitude,
      y1: s1.longitude,
      x2: s1.latitude,
      y2: s1.longitude,
    };
    stations.forEach(s => {
      coordinates.x1 = Math.min(coordinates.x1, s.latitude);
      coordinates.y1 = Math.min(coordinates.y1, s.longitude);
      coordinates.x2 = Math.max(coordinates.x2, s.latitude);
      coordinates.y2 = Math.max(coordinates.y2, s.longitude);
    });

    const { x1, y1, x2, y2 } = coordinates;

    return { lat: x1 + (x2 - x1) / 2, lng: y1 + (y2 - y1) / 2 };
  }

  render() {
    const { classes, stations, stationIndices } = this.props;
    let { center, selectedId, zoom } = this.state;
    const index = stationIndices[selectedId];
    const station =
      index !== undefined ? stations[stationIndices[selectedId]] : undefined;
    const topStations = this.findTopStations(selectedId);

    // TODO: Only reset center when area changed
    if (index === undefined && stations.length > 0) {
      center = this.findCenter(stations);
      zoom = 10;
    }

    return (
      <Grid container spacing={24}>
        <Grid item xs={12} md={8}>
          <MyMap
            center={center}
            zoom={zoom}
            stations={this.props.stations}
            selectedId={this.state.selectedId}
            handleStationChange={this.handleStationChange}
            handleZoomChange={this.handleZoomChange}
            destinations={topStations}
            googleMapURL="https://maps.googleapis.com/maps/api/js?key=AIzaSyC1SheoT7QbC2NwkAQnM50vckjfPJSXv6s&v=3.exp&libraries=geometry,drawing,places"
            loadingElement={<div style={{ height: `100%` }} />}
            containerElement={<div style={{ height: `80vh` }} />}
            mapElement={<div style={{ height: `100%` }} />}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            id="select-area"
            select
            className={classes.textField}
            value={this.state.selectedId || 0}
            onChange={this.handleSelectChange}
            SelectProps={{
              MenuProps: {
                className: classes.menu,
              },
            }}
            margin="normal"
          >
            {stations.map(option => (
              <MenuItem key={option.id} value={option.id}>
                {option.name}
              </MenuItem>
            ))}
          </TextField>
          {station && (
            <Grid container>
              <Grid item xs={12}>
                <Typography variant="headline">{station.name}</Typography>
                <Typography variant="subheading">
                  {station.area.name}
                </Typography>
              </Grid>
              <Grid item xs={10}>
                {this.renderDestinationList(topStations)}
              </Grid>
            </Grid>
          )}
        </Grid>
      </Grid>
    );
  }
}

MapContainer.propTypes = {
  classes: PropTypes.object.isRequired,
  stations: PropTypes.array.isRequired,
  stationIndices: PropTypes.object.isRequired,
  trips: PropTypes.array.isRequired,
};

const styles = theme => {
  return {
    destination: {
      marginTop: 16,
      marginBottom: 8,
    },
    textField: {
      width: 360,
      marginBottom: 16,
    },
    menu: {
      width: 360,
    },
  };
};

export default withStyles(styles, { withTheme: true })(MapContainer);
