/**
 * @module domain/scorecard
 * @version 1.0.0
 * @author Peter Schmalfeldt <me@peterschmalfeldt.com>
 */

const _ = require('lodash')

const models = require('../../../models')
const util = require('./util')
const omitColumns = ['id', 'country_id', 'state_id', 'city_id', 'county_id', 'agency_id', 'coordinate', 'created_date', 'modified_date', 'deletedAt']

const __buildAgency = (result) => {
  const agency = _.omit(result.dataValues, ['id', 'country_id', 'state_id', 'city_id', 'county_id', 'arrests', 'homicide', 'jail', 'police_accountability', 'police_funding', 'police_violence', 'policy', 'report', 'country', 'state', 'city', 'county', 'created_date', 'modified_date', 'deletedAt'])

  const results = {
    agency: util.sortByKeys(agency),
    arrests: result.dataValues.arrests
      ? util.sortByKeys(_.omit(result.dataValues.arrests.dataValues, omitColumns))
      : null,
    homicide: result.dataValues.homicide
      ? util.sortByKeys(_.omit(result.dataValues.homicide.dataValues, omitColumns))
      : null,
    jail: result.dataValues.jail
      ? util.sortByKeys(_.omit(result.dataValues.jail.dataValues, omitColumns))
      : null,
    police_accountability: result.dataValues.police_accountability
      ? util.sortByKeys(_.omit(result.dataValues.police_accountability.dataValues, omitColumns))
      : null,
    police_funding: result.dataValues.police_funding
      ? util.sortByKeys(_.omit(result.dataValues.police_funding.dataValues, omitColumns))
      : null,
    police_violence: result.dataValues.police_violence
      ? util.sortByKeys(_.omit(result.dataValues.police_violence.dataValues, omitColumns))
      : null,
    policy: result.dataValues.policy
      ? util.sortByKeys(_.omit(result.dataValues.policy.dataValues, omitColumns))
      : null,
    report: result.dataValues.report
      ? util.sortByKeys(_.omit(result.dataValues.report.dataValues, omitColumns))
      : null,
    geo: {
      country: result.dataValues.country
        ? util.sortByKeys(_.omit(result.dataValues.country.dataValues, omitColumns))
        : null,
      state: result.dataValues.state
        ? util.sortByKeys(_.omit(result.dataValues.state.dataValues, omitColumns))
        : null,
      city: result.dataValues.city
        ? util.sortByKeys(_.omit(result.dataValues.city.dataValues, omitColumns))
        : null,
      county: result.dataValues.county
        ? util.sortByKeys(_.omit(result.dataValues.county.dataValues, omitColumns))
        : null
    }
  }

  return results
}

/**
 * Domain Scorecard
 * @type {object}
 */
module.exports = {
  /**
   * Get US States and Support for Each
   */
  getGrades (state, type) {
    if (!state) {
      return Promise.reject('Missing Required `state` parameter')
    }

    if (!type) {
      return Promise.reject('Missing Required `type` parameter')
    }

    const stateDetails = util.getStateByID(state)

    // Search Counties for Sheriff Department
    return models.scorecard_agency.findAll({
      where: {
        type: type,
        state_id: stateDetails.id
      },
      include: [
        'report',
        'city',
        'county'
      ]
    }).then((agencies) => {
      if (agencies) {
        const grades = []

        agencies.forEach((agency) => {
          // Skip Agency if No Report Generated
          if (!agency.dataValues.report) {
            return
          }

          const grade = util.getGrade(agency.dataValues.report.dataValues.overall_score)

          grades.push({
            agency_name: agency.dataValues.name,
            change_overall_score: agency.dataValues.report.dataValues.change_overall_score || 0,
            district: (agency.dataValues.county) ? `us-${state.toLowerCase()}-${agency.dataValues.county.dataValues.fips_county_code}` : null,
            grade_class: grade.class,
            grade_letter: grade.letter,
            latitude: (agency.dataValues.city) ? util.parseFloat(agency.dataValues.city.dataValues.latitude) : null,
            longitude: (agency.dataValues.city) ? util.parseFloat(agency.dataValues.city.dataValues.longitude) : null,
            overall_score: agency.dataValues.report.dataValues.overall_score,
            slug: agency.dataValues.slug,
            title: `${agency.dataValues.name}, ${stateDetails.name} ${util.titleCase(agency.dataValues.type, true)}`,
            url_pretty: `/${state.toLowerCase()}/${agency.dataValues.type}/${agency.dataValues.slug}`,
            url: `/?state=${state.toLowerCase()}&type=${agency.dataValues.type}&location=${agency.dataValues.slug}`
          })
        })

        // Return the agencies in order of best score to worse
        return _.reverse(_.sortBy(grades, ['overall_score']))
      } else {
        return Promise.reject(`No location found for ${state} ${type}`)
      }
    })
  },

  /**
   * Get US States and Support for Each
   */
  getStates () {
    // Search Counties for Sheriff Department
    return models.scorecard_agency.findAll({
      include: [
        'report',
        'city',
        'county'
      ]
    }).then((agencies) => {
      if (agencies) {
        const cleanAgencies = {}

        agencies.forEach((agency) => {
          // Skip Agency if No Report Generated
          if (!agency.dataValues.report) {
            return
          }

          const grade = util.getGrade(agency.dataValues.report.dataValues.overall_score)
          const stateDetails = util.getStateAbbrByID(agency.dataValues.state_id)

          /* istanbul ignore else */
          if (stateDetails) {
            /* istanbul ignore else */
            if (!cleanAgencies.hasOwnProperty(stateDetails.abbr)) { // eslint-disable-line no-prototype-builtins
              cleanAgencies[stateDetails.abbr] = {
                average_grade_class: '',
                average_grade_letter: '',
                average_grade_marker: '',
                average_score: 0,
                total_agencies: 0,
                total_overall_score: 0,
                total_population: 0
              }
            }

            /* istanbul ignore else */
            if (!cleanAgencies[stateDetails.abbr].hasOwnProperty(agency.dataValues.type)) { // eslint-disable-line no-prototype-builtins
              cleanAgencies[stateDetails.abbr][agency.dataValues.type] = []
            }

            // Add Agencies to State
            cleanAgencies[stateDetails.abbr][agency.dataValues.type].push({
              agency_name: agency.dataValues.name,
              district: (agency.dataValues.county) ? `us-${stateDetails.abbr.toLowerCase()}-${agency.dataValues.county.dataValues.fips_county_code}` : null,
              grade_class: grade.class,
              grade_letter: grade.letter,
              grade_marker: grade.marker,
              latitude: (agency.dataValues.city) ? util.parseFloat(agency.dataValues.city.dataValues.latitude) : null,
              longitude: (agency.dataValues.city) ? util.parseFloat(agency.dataValues.city.dataValues.longitude) : null,
              overall_score: agency.dataValues.report.dataValues.overall_score,
              population: agency.dataValues.total_population,
              slug: agency.dataValues.slug,
              title: `${agency.dataValues.name}, ${stateDetails.name} ${util.titleCase(agency.dataValues.type, true)}`,
              url_pretty: `/${stateDetails.abbr.toLowerCase()}/${agency.dataValues.type}/${agency.dataValues.slug}`,
              url: `/?state=${stateDetails.abbr.toLowerCase()}&type=${agency.dataValues.type}&location=${agency.dataValues.slug}`
            })
          }
        })

        // Generate Report per State and Prepare for Output
        Object.keys(cleanAgencies).forEach(key => {
          Object.keys(cleanAgencies[key]).forEach(type => {
            const currentCount = parseInt(cleanAgencies[key].total_agencies) || 0
            const currentPopulation = parseInt(cleanAgencies[key].total_population) || 0
            const currentOverallScore = parseInt(cleanAgencies[key].total_overall_score) || 0

            cleanAgencies[key][type] = _.reverse(_.sortBy(cleanAgencies[key][type], ['population']))
            cleanAgencies[key].total_agencies = currentCount + cleanAgencies[key][type].length
            cleanAgencies[key].total_population = currentPopulation + _.sumBy(cleanAgencies[key][type], 'population')
            cleanAgencies[key].total_overall_score = currentOverallScore + _.sumBy(cleanAgencies[key][type], 'overall_score')
          })

          const averageScore = Math.floor(cleanAgencies[key].total_overall_score / cleanAgencies[key].total_agencies)
          const averageGrade = util.getGrade(averageScore)

          cleanAgencies[key].average_score = averageScore
          cleanAgencies[key].average_grade_class = averageGrade.class
          cleanAgencies[key].average_grade_letter = averageGrade.letter
          cleanAgencies[key].average_grade_marker = averageGrade.marker
        })

        // Return the agencies in order of best score to worse
        return cleanAgencies
      } else {
        return Promise.reject('No location found')
      }
    })
  },

  /**
   * Get Specific US State and Active Scorecards sorted by population
   */
  getState (state) {
    if (!state) {
      return Promise.reject('Missing Required `state` parameter')
    }

    const stateDetails = util.getStateByID(state)

    // Search Counties for Sheriff Department
    return models.scorecard_agency.findAll({
      where: {
        state_id: stateDetails.id
      },
      include: [
        'report',
        'city',
        'county'
      ]
    }).then((agencies) => {
      if (agencies) {
        const cleanAgencies = {
          average_grade_class: '',
          average_grade_letter: '',
          average_grade_marker: '',
          average_score: 0,
          total_agencies: 0,
          total_overall_score: 0,
          total_population: 0
        }

        const defaultKeys = Object.keys(cleanAgencies)

        agencies.forEach((agency) => {
          // Skip Agency if No Report Generated
          if (!agency.dataValues.report) {
            return
          }

          /* istanbul ignore else */
          if (!cleanAgencies.hasOwnProperty(agency.dataValues.type)) { // eslint-disable-line no-prototype-builtins
            cleanAgencies[agency.dataValues.type] = []
          }

          const grade = util.getGrade(agency.dataValues.report.dataValues.overall_score)

          cleanAgencies[agency.dataValues.type].push({
            agency_name: agency.dataValues.name,
            district: (agency.dataValues.county) ? `us-${state.toLowerCase()}-${agency.dataValues.county.dataValues.fips_county_code}` : null,
            grade_class: grade.class,
            grade_letter: grade.letter,
            grade_marker: grade.marker,
            latitude: (agency.dataValues.city) ? util.parseFloat(agency.dataValues.city.dataValues.latitude) : null,
            longitude: (agency.dataValues.city) ? util.parseFloat(agency.dataValues.city.dataValues.longitude) : null,
            overall_score: agency.dataValues.report.dataValues.overall_score,
            population: agency.dataValues.total_population,
            slug: agency.dataValues.slug,
            title: `${agency.dataValues.name}, ${stateDetails.name} ${util.titleCase(agency.dataValues.type, true)}`,
            url: `/?state=${state.toLowerCase()}&type=${agency.dataValues.type}&location=${agency.dataValues.slug}`,
            url_pretty: `/${state.toLowerCase()}/${agency.dataValues.type}/${agency.dataValues.slug}`
          })
        })

        // Generate Report per State and Prepare for Output
        Object.keys(cleanAgencies).forEach(type => {
          if (defaultKeys.indexOf(type) !== -1) {
            return
          }

          const currentCount = parseInt(cleanAgencies.total_agencies) || 0
          const currentPopulation = parseInt(cleanAgencies.total_population) || 0
          const currentOverallScore = parseInt(cleanAgencies.total_overall_score) || 0

          cleanAgencies[type] = _.reverse(_.sortBy(cleanAgencies[type], ['population']))
          cleanAgencies.total_agencies = currentCount + cleanAgencies[type].length
          cleanAgencies.total_population = currentPopulation + _.sumBy(cleanAgencies[type], 'population')
          cleanAgencies.total_overall_score = currentOverallScore + _.sumBy(cleanAgencies[type], 'overall_score')
        })

        const averageScore = Math.floor(cleanAgencies.total_overall_score / cleanAgencies.total_agencies)
        const averageGrade = util.getGrade(averageScore)

        cleanAgencies.average_score = averageScore
        cleanAgencies.average_grade_class = averageGrade.class
        cleanAgencies.average_grade_letter = averageGrade.letter
        cleanAgencies.average_grade_marker = averageGrade.marker

        // Return the agencies in order of best score to worse
        return cleanAgencies
      } else {
        return Promise.reject(`No location found for ${state}`)
      }
    })
  },

  /**
   * Get Report
   * @param {String} state
   * @param {String} type
   * @param {String} location
   */
  getReport (state, type, location) {
    if (!state) {
      return Promise.reject('Missing Required `state` parameter')
    }

    if (!type) {
      return Promise.reject('Missing Required `type` parameter')
    }

    if (!location) {
      return Promise.reject('Missing Required `location` parameter')
    }

    const stateDetails = util.getStateByID(state)

    // Search Counties for Sheriff Department
    return models.scorecard_agency.findOne({
      where: {
        type: type,
        state_id: stateDetails.id,
        slug: location
      },
      include: [
        'arrests',
        'homicide',
        'jail',
        'police_accountability',
        'police_funding',
        'police_violence',
        'policy',
        'report',
        'country',
        'state',
        'city',
        'county'
      ]
    }).then((result) => {
      if (result && result.dataValues) {
        return __buildAgency(result)
      } else {
        return Promise.reject(`No location found for ${state} ${type} ${location}`)
      }
    })
  }
}
