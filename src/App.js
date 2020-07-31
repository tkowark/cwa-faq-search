import React, { Component } from 'react'
import extend from 'lodash/extend'
import { SearchkitManager,SearchkitProvider,
  SearchBox, Pagination,
  Hits, HitsStats,
  Layout, TopBar, LayoutBody, LayoutResults,
  ResetFilters, GroupedSelectedFilters, SideBar,
  RefinementListFilter,
  ActionBar, ActionBarRow } from 'searchkit'
import './index.css'

const host = "/search"
const searchkit = new SearchkitManager(host)

const IssueHitsListItem = (props)=> {
  const {bemBlocks, result} = props
  let url = "http://www.github.com/corona-warn-app/cwa-faq/issues/" + result._source.issueNumber
  const source = extend({}, result._source, result.highlight)
  // Display issues and comments differently
  switch(result._source.type){
    case "issue": {
      return (
        <div className={bemBlocks.item().mix(bemBlocks.container("item"))} data-qa="hit">
          <div className={bemBlocks.item("details")}>
            <a href={url} target="_blank">
              <h2 className={bemBlocks.item("title") + " issue"} dangerouslySetInnerHTML={{__html:source.title}}></h2>
            </a>
            <p className={bemBlocks.item("details")} dangerouslySetInnerHTML={{__html:source.body}}></p>
          </div>
        </div>
      )
    }
    case "comment": {
      return (
        <div className={bemBlocks.item().mix(bemBlocks.container("item"))} data-qa="hit">
          <div className={bemBlocks.item("details")}>
            <a href={url} target="_blank">
              <h2 className={bemBlocks.item("title") + " comment"}>Comment (Issue {source.issueNumber})</h2>
            </a>
            <p className={bemBlocks.item("details")} dangerouslySetInnerHTML={{__html:source.body}}></p>
          </div>
        </div>
      )
    }
    default: {
      return (
        <div><p>Invalid Item</p></div>
      )
    }
  }
}

const formatCount = (count) => {
  if(count.value){
    return count.value.toString()
  } else {
    return "0";
  }
}

class App extends Component {
  render() {
    return (
      <SearchkitProvider searchkit={searchkit}>
        <Layout>
          <TopBar>
            <div className="my-logo">Corona-Warn-App FAQ</div>
            <SearchBox autofocus={true} searchOnChange={true} prefixQueryFields={["title^1","body^2"]}/>
          </TopBar>
          <LayoutBody>
          <SideBar>
            <RefinementListFilter id="types" title="Types" field="type" size={10}/>
            <RefinementListFilter id="tags" title="Tags" field="labels" operator="OR" size={30}/>
          </SideBar>
          <LayoutResults>
            <ActionBar>

              <ActionBarRow>
                <HitsStats countFormatter={formatCount} />
                <GroupedSelectedFilters/>
                <ResetFilters/>
              </ActionBarRow>

            </ActionBar>
            <div>
              <Hits
                hitsPerPage={50} highlightFields={["title", "body"]} sourceFilter={["body", "title", "issueNumber", "type", "tags"]}
                mod="sk-hits-list" itemComponent={IssueHitsListItem}/>
            </div>
            <Pagination showNumbers={true}/>
          </LayoutResults>

          </LayoutBody>
        </Layout>
      </SearchkitProvider>
    );
  }
}

export default App;
