import qs from 'query-string'
import { Card, Stack } from '@shopify/polaris'
import { useEffect, useState } from 'react'
import VendorApi from '../../api/vendor.js'
import AppHeader from '../../components/AppHeader/index.jsx'
import MyPagination from '../../components/MyPagination/index.jsx'
import PagePreloader from '../../components/PagePreloader/index.jsx'
import ConfirmDelete from './ConfirmDelete.jsx'
import CreateForm from './CreateForm.jsx'
import Table from './Table.jsx'
import { useLocation, useSearchParams } from 'react-router-dom'

function VendorsPage(props) {
  const { actions, vendors } = props
  console.log('vendors', vendors)

  const location = useLocation()

  const [searchParams, setSearchParams] = useSearchParams()

  const [isReady, setIsReady] = useState(false)
  const [created, setCreated] = useState(null)
  const [deleted, setDeleted] = useState(null)

  useEffect(() => {
    if (!isReady && vendors) {
      setIsReady(true)
    }
  })

  const getVendors = async (query = `?page=1&limit=10`) => {
    try {
      actions.showAppLoading()
      let res = await VendorApi.find(query)

      if (!res.success) {
        throw res.error
      }

      actions.setVendors(res.data)
    } catch (error) {
      console.log(error)
      actions.showNotify({ error: true, message: error.message })
    } finally {
      actions.hideAppLoading()
    }
  }

  useEffect(() => {
    if (!vendors || location.search) {
      getVendors(location.search)
    }
  }, [location.search])

  const handleFilter = (filter) => {
    let params = qs.parse(location.search) || {}

    if ('page' in filter) {
      if (filter.page) {
        params = { ...filter, page: filter.page }
      } else {
        delete params.page
      }
    }

    if ('limit' in filter) {
      if (filter.limit) {
        params = { ...filter, limit: filter.limit }
      } else {
        delete params.limit
      }
    }

    setSearchParams(params)
  }

  const handleSubmit = async (formData) => {
    try {
      actions.showAppLoading()
      console.log('formData', formData)

      let data = {}
      Object.keys(formData).forEach((key) =>
        formData[key].value ? (data[key] = formData[key].value) : null,
      )

      let res = null
      if (created.id) {
        res = await VendorApi.update(created.id, data)
      } else {
        res = await VendorApi.create(data)
      }
      if (!res.success) {
        throw res.error
      }

      actions.showNotify({ message: created.id ? 'Saved' : 'Added' })
      setCreated(null)
      getVendors()
    } catch (error) {
      console.log(error)
      actions.showNotify({ error: true, message: error.message })
    } finally {
      actions.hideAppLoading()
    }
  }

  const handleDelete = async (deleted) => {
    try {
      actions.showAppLoading()

      let res = await VendorApi.delete(deleted.id)
      if (!res.success) {
        throw res.error
      }

      actions.showNotify({ message: 'Deleted' })

      getVendors()
    } catch (error) {
      console.log(error)
      actions.showNotify({ message: error.message, error: true })
    } finally {
      actions.hideAppLoading()
    }
  }

  if (!isReady) {
    return <PagePreloader />
  }

  if (created) {
    return (
      <CreateForm
        {...props}
        created={created}
        onDiscard={() => setCreated(null)}
        onSubmit={(formData) => handleSubmit(formData)}
      />
    )
  }

  return (
    <Stack vertical alignment="fill">
      <AppHeader
        title="Vendors"
        actions={[
          {
            label: 'Add vendor',
            primary: true,
            onClick: () => setCreated({}),
          },
        ]}
      />

      <Card>
        <Card.Section>
          <div>
            Total items: <b>{vendors?.length}</b>
          </div>
        </Card.Section>
        <Table
          {...props}
          onEdit={(item) => setCreated(item)}
          onDelete={(item) => setDeleted(item)}
        />

        <Card.Section>
          <MyPagination
            page={vendors.page}
            limit={vendors.limit}
            totalPages={vendors.totalPages}
            onChange={({ page, limit }) => handleFilter({ page, limit })}
          />
        </Card.Section>
      </Card>

      {deleted && (
        <ConfirmDelete
          onDiscard={() => setDeleted(null)}
          onSubmit={() => handleDelete(deleted) & setDeleted(null)}
        />
      )}
    </Stack>
  )
}

export default VendorsPage
